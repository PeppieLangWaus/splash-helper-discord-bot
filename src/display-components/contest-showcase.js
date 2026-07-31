const {
  ButtonStyle,
  ContainerBuilder,
  UserSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  name: "contest-showcase",
  description: "Display component template with section, separator, and select menu",
  buildComponent() {
    return new ContainerBuilder()
      .setAccentColor(0x0099ff)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "This text is inside a Text Display component! You can use **any __markdown__** available inside this component too."
        )
        
      )
      .addActionRowComponents((actionRow) =>
        actionRow.setComponents(
          new UserSelectMenuBuilder()
            .setCustomId("exampleSelect")
            .setPlaceholder("Select users")
        )
      )
      .addSeparatorComponents((separator) => separator)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents(
            (textDisplay) =>
              textDisplay.setContent(
                "This text is inside a Text Display component! You can use **any __markdown__** available inside this component too."
              ),
            (textDisplay) =>
              textDisplay.setContent(
                "And you can place one button or one thumbnail component next to it!"
              )
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId("exampleButton")
              .setLabel("Button inside a Section")
              .setStyle(ButtonStyle.Primary)
          )
      );
  },
};
