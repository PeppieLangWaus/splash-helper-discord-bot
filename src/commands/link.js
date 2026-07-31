const { SlashCommandBuilder, ChannelType } = require("discord.js");
const store = require("../store");
const backendApi = require("../backendApi");
const { buildResolveButtons } = require("../tickets");

const REPLY_TIMEOUT_MS = 5 * 60 * 1000;

async function collectReply(thread, userId) {
  const collected = await thread.awaitMessages({
    filter: (m) => m.author.id === userId,
    max: 1,
    time: REPLY_TIMEOUT_MS,
  });
  const message = collected.first();
  return message ? message.content.trim() : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Splash Helper account to Discord and apply as a splasher"),
  async execute(interaction) {
    const guildConfig = store.getGuild(interaction.guildId);
    if (!guildConfig) {
      await interaction.reply({
        content: "This server hasn't run /setup yet — ask a server admin to set it up first.",
        ephemeral: true,
      });
      return;
    }

    const parentChannel = guildConfig.splasherLinkChannelId
      ? await interaction.guild.channels.fetch(guildConfig.splasherLinkChannelId).catch(() => null)
      : null;
    if (!parentChannel || !parentChannel.isTextBased()) {
      await interaction.reply({
        content: "The splasher-link channel isn't configured correctly — ask an admin to rerun /setup.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ content: "Opening a private thread to verify your account…", ephemeral: true });

    const thread = await parentChannel.threads.create({
      name: `link-${interaction.user.username}`.slice(0, 90),
      type: ChannelType.PrivateThread,
      reason: `Account link request from ${interaction.user.tag}`,
    });
    await thread.members.add(interaction.user.id).catch(() => {});

    await thread.send(
      `${interaction.user}, please reply with your **plugin sync token** (found in Account Settings on the website).`,
    );
    const token = await collectReply(thread, interaction.user.id);
    if (!token) {
      await thread.send("Timed out waiting for a reply — run /link again to retry.");
      await thread.setArchived(true).catch(() => {});
      return;
    }

    await thread.send("Now reply with your **RSN** (in-game username).");
    const rsn = await collectReply(thread, interaction.user.id);
    if (!rsn) {
      await thread.send("Timed out waiting for a reply — run /link again to retry.");
      await thread.setArchived(true).catch(() => {});
      return;
    }

    let result;
    try {
      result = await backendApi.linkAccount(guildConfig.apiToken, { pluginToken: token, rsn });
    } catch (error) {
      await thread.send("Something went wrong verifying your account — ask an admin for help.");
      return;
    }

    if (!result.matched) {
      await thread.send(
        "No account found matching that token and RSN. Double-check both on the website and run /link again.",
      );
      await thread.setArchived(true).catch(() => {});
      return;
    }

    if (result.status === "added") {
      await thread.send(`✅ You're linked and added as a splasher for **${result.communityName}**!`);
      await thread.setArchived(true).catch(() => {});
      return;
    }

    const { config: discordConfig } = await backendApi
      .getDiscordConfig(guildConfig.apiToken)
      .catch(() => ({ config: null }));
    const supportRoleMentions = (discordConfig?.supportRoleIds ?? []).map((id) => `<@&${id}>`).join(" ");
    await thread.send({
      content:
        `Account verified — waiting on staff approval to join **${result.communityName}**.` +
        (supportRoleMentions ? ` ${supportRoleMentions}` : ""),
      components: [buildResolveButtons(result.applicationId)],
    });
  },
};
