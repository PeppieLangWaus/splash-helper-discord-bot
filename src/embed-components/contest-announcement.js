const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "contest-announcement",
  description: "Template for announcing a new contest",
  buildEmbed() {
    return new EmbedBuilder()
      .setColor(0x1f8b4c)
      .setTitle("Splash Contest Is Live")
      .setDescription("Submit your look this week and vote for your favorites.")
      .addFields(
        { name: "Theme", value: "Summer Nights", inline: true },
        { name: "Deadline", value: "Sunday 20:00 UTC", inline: true },
        { name: "How to Enter", value: "Post one screenshot in #contest-entry" }
      )
      .setFooter({ text: "Splash Helper Template" })
      .setTimestamp();
  },
};
