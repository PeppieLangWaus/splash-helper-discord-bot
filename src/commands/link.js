const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const store = require("../store");
const backendApi = require("../backendApi");
const { buildResolveButtons } = require("../tickets");
const { postBankLogMessage } = require("../bankTickets");

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

    const modal = new ModalBuilder()
      .setCustomId("link:modal")
      .setTitle("Link Splash Helper Account")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("pluginToken")
            .setLabel("Plugin sync token (Account Settings)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("rsn")
            .setLabel("RSN (in-game username)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      );

    await interaction.showModal(modal);
  },

  async handleModalSubmit(interaction) {
    const guildConfig = store.getGuild(interaction.guildId);
    if (!guildConfig) {
      await interaction.reply({
        content: "This server hasn't run /setup yet — ask a server admin to set it up first.",
        ephemeral: true,
      });
      return;
    }

    const pluginToken = interaction.fields.getTextInputValue("pluginToken").trim();
    const rsn = interaction.fields.getTextInputValue("rsn").trim();

    const { config: discordConfig } = await backendApi
      .getDiscordConfig(guildConfig.apiToken)
      .catch(() => ({ config: null }));

    const parentChannel = discordConfig?.splasherLinkChannelId
      ? await interaction.guild.channels.fetch(discordConfig.splasherLinkChannelId).catch(() => null)
      : null;

    const ts = Math.floor(Date.now() / 1000);
    const logAttempt = (content) =>
      parentChannel?.isTextBased()
        ? postBankLogMessage(parentChannel, content, `link-${interaction.user.username}`).catch(() => null)
        : Promise.resolve(null);

    let result;
    try {
      result = await backendApi.linkAccount(guildConfig.apiToken, {
        pluginToken,
        rsn,
        discordUserId: interaction.user.id,
      });
    } catch (error) {
      await logAttempt(`<t:${ts}:f> - ${interaction.user} tried to \`/link\` (RSN: ${rsn}) but verification failed.`);
      await interaction.reply({
        content: "Something went wrong verifying your account — ask an admin for help.",
        ephemeral: true,
      });
      return;
    }

    if (!result.matched) {
      await logAttempt(
        `<t:${ts}:f> - ${interaction.user} tried to \`/link\` with RSN **${rsn}** but no matching account was found.`,
      );
      await interaction.reply({
        content:
          "No account found matching that token and RSN. Double-check both on the website and run /link again.",
        ephemeral: true,
      });
      return;
    }

    if (result.status === "added") {
      await logAttempt(
        `<t:${ts}:f> - ${interaction.user} linked and was auto-added as a splasher for **${result.communityName}**.`,
      );
      await interaction.reply({
        content: `✅ You're linked and added as a splasher for **${result.communityName}**!`,
        ephemeral: true,
      });
      return;
    }

    const logged = await logAttempt(
      `<t:${ts}:f> - ${interaction.user} linked and requested to join as a splasher for **${result.communityName}**.`,
    );

    if (logged) {
      const { thread } = logged;
      await thread.members.add(interaction.user.id).catch(() => {});

      const supportRoleMentions = (discordConfig?.supportRoleIds ?? []).map((id) => `<@&${id}>`).join(" ");
      await thread.send({
        content:
          `${interaction.user} verified their account — waiting on staff approval to join **${result.communityName}**.` +
          (supportRoleMentions ? ` ${supportRoleMentions}` : ""),
        components: [buildResolveButtons(result.applicationId)],
      });
    }

    await interaction.reply({
      content: `Account verified — waiting on staff approval to join **${result.communityName}**.`,
      ephemeral: true,
    });
  },
};
