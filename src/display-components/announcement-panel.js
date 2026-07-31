const { ContainerBuilder } = require("discord.js");

module.exports = {
  name: "announcement-panel",
  description: "Display component template with thumbnail accessory",
  buildComponent() {
    return new ContainerBuilder()
      .setAccentColor(0x57f287)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## Weekly Theme Announced\nUse this panel format for quick updates.")
      )
      .addSeparatorComponents((separator) => separator)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents(
            (textDisplay) =>
              textDisplay.setContent("Submit your best style screenshot before Sunday."),
            (textDisplay) =>
              textDisplay.setContent("Voting opens automatically right after submissions close.")
          )
          .setThumbnailAccessory((thumbnail) =>
            thumbnail.setURL("https://i.imgur.com/AfFp7pu.png")
          )
      );
  },
};
