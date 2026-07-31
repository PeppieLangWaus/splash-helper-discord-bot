const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const store = require("../store");
const backendApi = require("../backendApi");
const { parseGpAmount, formatGp } = require("../gp");
const { hasBankManagerRole, postBankLogMessage, awaitScreenshotReply } = require("../bankTickets");

async function handleBalance(interaction, guildConfig) {
  const result = await backendApi.getBank(guildConfig.apiToken).catch(() => null);
  if (!result) {
    await interaction.reply({ content: "Couldn't load the bank right now — try again shortly.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Community bank")
    .setColor(0x1e3a5f)
    .addFields(
      { name: "Balance", value: `${formatGp(result.bankGp)} gp`, inline: true },
      { name: "Minimum payout", value: `${formatGp(result.minPayoutGp)} gp`, inline: true },
    )
    .setDescription(
      "**Commands**\n`/bank balance` — view the bank\n`/bank deposit <amount>` — add gp (bank managers)\n`/bank withdraw <amount>` — remove gp (bank managers)",
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleTransaction(interaction, guildConfig, type) {
  const { config } = await backendApi.getDiscordConfig(guildConfig.apiToken).catch(() => ({ config: null }));
  if (!hasBankManagerRole(interaction, config)) {
    await interaction.reply({ content: "You don't have permission to do that.", ephemeral: true });
    return;
  }

  const amountGp = parseGpAmount(interaction.options.getString("amount", true));
  if (!amountGp) {
    await interaction.reply({
      ephemeral: true,
      content: "Invalid amount — use a plain number or something like `100k`, `10m`, `1b`.",
    });
    return;
  }

  if (!config?.bankChannelId) {
    await interaction.reply({
      ephemeral: true,
      content: "No bank channel is configured — ask an admin to run /setup.",
    });
    return;
  }
  const bankChannel = await interaction.guild.channels.fetch(config.bankChannelId).catch(() => null);
  if (!bankChannel?.isTextBased()) {
    await interaction.reply({ ephemeral: true, content: "Couldn't find the configured bank channel." });
    return;
  }

  let ticket;
  try {
    ({ ticket } = await backendApi.createBankTicket(guildConfig.apiToken, {
      type,
      amountGp,
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.username,
    }));
  } catch (error) {
    await interaction.reply({ ephemeral: true, content: error.body?.error || "Could not open that ticket." });
    return;
  }

  const verbing = type === "deposit" ? "depositing" : "withdrawing";
  const { message: pendingMessage, thread } = await postBankLogMessage(
    bankChannel,
    `⏳ ${interaction.user} is ${verbing} **${formatGp(amountGp)}**…`,
    `${type}-${interaction.user.username}`,
  );
  await thread.members.add(interaction.user.id).catch(() => {});

  await interaction.reply({ content: `${type === "deposit" ? "Deposit" : "Withdraw"} ticket opened: ${thread}`, ephemeral: true });

  const screenshotUrl = await awaitScreenshotReply(
    thread,
    interaction.user.id,
    `${interaction.user}, please reply to **this message** with a screenshot to confirm this ${type} of **${formatGp(amountGp)}**.`,
  );

  if (!screenshotUrl) {
    await backendApi
      .resolveBankTicket(guildConfig.apiToken, ticket._id, {
        approve: false,
        authorizedByDiscordId: interaction.user.id,
        authorizedByUsername: interaction.user.username,
      })
      .catch(() => {});
    await pendingMessage.edit(`❌ ${interaction.user}'s ${type} of **${formatGp(amountGp)}** timed out and was cancelled.`);
    await thread.send("No screenshot received in time — this ticket was cancelled.");
    await thread.setArchived(true).catch(() => {});
    return;
  }

  let resolved;
  try {
    resolved = await backendApi.resolveBankTicket(guildConfig.apiToken, ticket._id, {
      approve: true,
      screenshotUrl,
      authorizedByDiscordId: interaction.user.id,
      authorizedByUsername: interaction.user.username,
    });
  } catch (error) {
    await thread.send(`⚠️ Failed to record this ${type}: ${error.body?.error || "unknown error"}`);
    return;
  }

  const verbed = type === "deposit" ? "deposited" : "withdrawn";
  const ts = Math.floor(Date.now() / 1000);
  await pendingMessage.edit(`<t:${ts}:f> - ${interaction.user.username} has ${verbed} **${formatGp(amountGp)}**`);
  await thread.send(
    `✅ Confirmed. ${verbed[0].toUpperCase()}${verbed.slice(1)} via \`/bank ${type}\` by ${interaction.user}. New bank balance: **${formatGp(resolved.bankGp)}**.`,
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("View or manage the community bank")
    .addSubcommand((sub) => sub.setName("balance").setDescription("View the community bank balance"))
    .addSubcommand((sub) =>
      sub
        .setName("deposit")
        .setDescription("Add gp to the community bank (bank managers only)")
        .addStringOption((option) =>
          option.setName("amount").setDescription("Amount to deposit, e.g. 10m").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("withdraw")
        .setDescription("Remove gp from the community bank (bank managers only)")
        .addStringOption((option) =>
          option.setName("amount").setDescription("Amount to withdraw, e.g. 10m").setRequired(true),
        ),
    ),
  async execute(interaction) {
    const guildConfig = store.getGuild(interaction.guildId);
    if (!guildConfig) {
      await interaction.reply({
        content: "This server hasn't run /setup yet — ask a server admin to set it up first.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub === "balance") {
      await handleBalance(interaction, guildConfig);
    } else if (sub === "deposit" || sub === "withdraw") {
      await handleTransaction(interaction, guildConfig, sub);
    }
  },
};
