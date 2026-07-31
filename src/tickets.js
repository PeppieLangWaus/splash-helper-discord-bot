const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const store = require("./store");
const backendApi = require("./backendApi");

const RESOLVE_ID_PATTERN = /^ticket:resolve:([a-f0-9]+):(approve|reject)$/;

/** Approve/Reject buttons for a pending splasher application, shared by the /link escalation
 *  thread and the website-application poller's tickets — both resolve the same way. */
function buildResolveButtons(applicationId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket:resolve:${applicationId}:approve`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ticket:resolve:${applicationId}:reject`)
      .setLabel("Reject")
      .setStyle(ButtonStyle.Danger),
  );
}

async function handleResolveButton(interaction) {
  const match = interaction.customId.match(RESOLVE_ID_PATTERN);
  if (!match) return false;

  const [, applicationId, action] = match;
  const guildConfig = store.getGuild(interaction.guildId);
  if (!guildConfig) {
    await interaction.reply({ content: "This server isn't linked to a community anymore.", ephemeral: true });
    return true;
  }

  const approve = action === "approve";
  try {
    await backendApi.resolveApplication(guildConfig.apiToken, applicationId, approve);
    await interaction.update({
      content: `${approve ? "✅ Approved" : "❌ Rejected"} by ${interaction.user}.`,
      components: [],
    });
    if (interaction.channel?.isThread()) {
      await interaction.channel.setArchived(true).catch(() => {});
    }
  } catch (error) {
    const message = error.body?.error || "Failed to resolve this application.";
    await interaction.reply({ content: message, ephemeral: true });
  }
  return true;
}

module.exports = { buildResolveButtons, handleResolveButton };
