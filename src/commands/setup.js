const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure this server for Splash Helper (server owner only)"),
  async execute(interaction) {
    if (interaction.guild.ownerId !== interaction.user.id) {
      await interaction.reply({ content: "Only the server owner can run /setup.", ephemeral: true });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("setup:modal")
      .setTitle("Splash Helper Setup")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("communityName")
            .setLabel("Community name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("apiToken")
            .setLabel("Community API token (from Account Settings)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      );

    await interaction.showModal(modal);
  },
};
