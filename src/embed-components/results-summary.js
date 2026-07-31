const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "results-summary",
  description: "Template for sharing contest results",
  buildEmbed() {
    return new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("Contest Results")
      .setDescription("Thanks everyone for participating in this round.")
      .addFields(
        { name: "1st", value: "PlayerOne", inline: true },
        { name: "2nd", value: "PlayerTwo", inline: true },
        { name: "3rd", value: "PlayerThree", inline: true }
      )
      .setFooter({ text: "Splash Helper Template" })
      .setTimestamp();
  },
};
