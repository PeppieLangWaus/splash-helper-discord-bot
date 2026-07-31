const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const store = require("./store");
const backendApi = require("./backendApi");
const { formatGp } = require("./gp");

const SCREENSHOT_TIMEOUT_MS = 10 * 60 * 1000;
const PAYOUT_BUTTON_PATTERN = /^bank:payout:([a-f0-9]+):(approve|reject)$/;

/** Normalizes interaction.member.roles into a plain array of role ids — it's a raw string[]
 *  when the bot has no GuildMembers intent (our case), or a Collection (`.roles.cache`) if a
 *  fully-hydrated GuildMember ever gets passed in instead. */
function memberRoleIds(interaction) {
  const member = interaction.member;
  if (!member) return [];
  if (Array.isArray(member.roles)) return member.roles;
  return [...member.roles.cache.keys()];
}

function hasBankManagerRole(interaction, discordConfig) {
  const roleIds = discordConfig?.bankManagerRoleIds ?? [];
  if (roleIds.length === 0) return false;
  const memberRoles = memberRoleIds(interaction);
  return roleIds.some((id) => memberRoles.includes(id));
}

function buildPayoutButtons(ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bank:payout:${ticketId}:approve`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`bank:payout:${ticketId}:reject`).setLabel("Reject").setStyle(ButtonStyle.Danger),
  );
}

/** Sends a message to a channel and starts a public thread on it. Used both as a pending
 *  placeholder that gets edited to its final form later (deposit/withdraw), and as a one-shot
 *  final post (a completed payout) — either way, the message itself is the channel's permanent
 *  "link to this thread" the bank channel is meant to show. */
async function postBankLogMessage(channel, content, threadName) {
  const message = await channel.send(content);
  const thread = await message.startThread({ name: threadName.slice(0, 90) });
  return { message, thread };
}

/** Posts a "reply to this message with a screenshot" prompt in `thread` and waits for exactly
 *  that. Filtering on `message.reference.messageId === prompt.id` matters beyond just picking
 *  the right message: a reply to the bot's own message is one of Discord's documented
 *  exceptions where content/attachments are delivered without the privileged Message Content
 *  intent, which this bot deliberately doesn't request. Returns the attachment URL, or null on
 *  timeout. */
async function awaitScreenshotReply(thread, userId, promptText) {
  const prompt = await thread.send(promptText);
  const collected = await thread
    .awaitMessages({
      filter: (m) => m.author.id === userId && m.reference?.messageId === prompt.id && m.attachments.size > 0,
      max: 1,
      time: SCREENSHOT_TIMEOUT_MS,
    })
    .catch(() => null);

  const attachment = collected?.first()?.attachments.first();
  return attachment?.url ?? null;
}

async function handlePayoutButton(interaction, ticketId, approve) {
  const guildConfig = store.getGuild(interaction.guildId);
  if (!guildConfig) {
    await interaction.reply({ content: "This server isn't linked to a community anymore.", ephemeral: true });
    return;
  }

  const { config } = await backendApi.getDiscordConfig(guildConfig.apiToken).catch(() => ({ config: null }));
  if (!hasBankManagerRole(interaction, config)) {
    await interaction.reply({ content: "You don't have permission to do that.", ephemeral: true });
    return;
  }

  if (!approve) {
    await backendApi
      .resolveBankTicket(guildConfig.apiToken, ticketId, {
        approve: false,
        authorizedByDiscordId: interaction.user.id,
        authorizedByUsername: interaction.user.username,
      })
      .catch(() => {});
    await interaction.update({ content: `❌ Rejected by ${interaction.user}.`, components: [] });
    if (interaction.channel?.isThread()) await interaction.channel.setArchived(true).catch(() => {});
    return;
  }

  await interaction.update({
    content: `${interaction.user} accepted this payout — waiting for a screenshot to confirm it.`,
    components: [],
  });

  const thread = interaction.channel;
  const screenshotUrl = await awaitScreenshotReply(
    thread,
    interaction.user.id,
    `${interaction.user}, please reply to **this message** with a screenshot to confirm the payout.`,
  );

  if (!screenshotUrl) {
    await backendApi
      .resolveBankTicket(guildConfig.apiToken, ticketId, {
        approve: false,
        authorizedByDiscordId: interaction.user.id,
        authorizedByUsername: interaction.user.username,
      })
      .catch(() => {});
    await thread.send(
      "No screenshot received in time — this payout was not completed. The splasher can run `/income payout` again if still eligible.",
    );
    await thread.setArchived(true).catch(() => {});
    return;
  }

  let resolved;
  try {
    resolved = await backendApi.resolveBankTicket(guildConfig.apiToken, ticketId, {
      approve: true,
      screenshotUrl,
      authorizedByDiscordId: interaction.user.id,
      authorizedByUsername: interaction.user.username,
    });
  } catch (error) {
    await thread.send(`⚠️ Failed to record this payout: ${error.body?.error || "unknown error"}`);
    return;
  }

  const { ticket, bankGp } = resolved;
  await thread.send(
    `✅ Payout of **${formatGp(ticket.amountGp)}** confirmed for ${ticket.requestedByUsername}, authorized by ${interaction.user}.`,
  );
  await thread.setArchived(true).catch(() => {});

  if (config?.bankChannelId) {
    const bankChannel = await interaction.guild.channels.fetch(config.bankChannelId).catch(() => null);
    if (bankChannel?.isTextBased()) {
      const ts = Math.floor(Date.now() / 1000);
      const { thread: logThread } = await postBankLogMessage(
        bankChannel,
        `<t:${ts}:f> - ${ticket.requestedByUsername} has withdrawn **${formatGp(ticket.amountGp)}**`,
        `payout-${ticket.requestedByUsername}`,
      );
      await logThread.send(
        `Paid out via \`/income payout\`, authorized by ${interaction.user}. New bank balance: **${formatGp(bankGp)}**.`,
      );
    }
  }
}

async function handleInteraction(interaction) {
  if (!interaction.isButton()) return false;
  const match = interaction.customId?.match(PAYOUT_BUTTON_PATTERN);
  if (!match) return false;

  const [, ticketId, action] = match;
  await handlePayoutButton(interaction, ticketId, action === "approve");
  return true;
}

module.exports = {
  memberRoleIds,
  hasBankManagerRole,
  buildPayoutButtons,
  postBankLogMessage,
  awaitScreenshotReply,
  handleInteraction,
};
