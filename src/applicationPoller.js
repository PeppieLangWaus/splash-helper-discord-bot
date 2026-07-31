const { EmbedBuilder } = require("discord.js");
const store = require("./store");
const backendApi = require("./backendApi");
const { buildResolveButtons } = require("./tickets");

const POLL_INTERVAL_MS = 60 * 1000;

// Applications the poller has already posted a ticket for, so a still-pending application
// doesn't get re-posted every tick. In-memory only — a bot restart could in the worst case
// re-post a ticket for something still pending, which is harmless (staff just sees it twice).
const postedApplicationIds = new Set();

async function pollGuild(client, guildId, guildConfig) {
  const [applicationsResult, configResult] = await Promise.all([
    backendApi.getPendingApplications(guildConfig.apiToken).catch(() => null),
    backendApi.getDiscordConfig(guildConfig.apiToken).catch(() => null),
  ]);
  const ticketChannelId = configResult?.config?.supportTicketChannelId;
  if (!applicationsResult || !ticketChannelId) return;

  // Only website-sourced applications need this poller — /link already handles its own
  // discord-link applications directly, in the same interaction that created them.
  const websiteApplications = applicationsResult.applications.filter(
    (app) => app.source === "website" && !postedApplicationIds.has(app._id),
  );
  if (websiteApplications.length === 0) return;

  const channel = await client.channels.fetch(ticketChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const supportRoleMentions = (configResult.config.supportRoleIds ?? []).map((id) => `<@&${id}>`).join(" ");

  for (const application of websiteApplications) {
    const embed = new EmbedBuilder()
      .setTitle("New splasher application")
      .setDescription("Someone applied to join this community through the website.")
      .setColor(0x1e3a5f)
      .setTimestamp(new Date(application.createdAt));

    await channel.send({
      content: supportRoleMentions || undefined,
      embeds: [embed],
      components: [buildResolveButtons(application._id)],
    });
    postedApplicationIds.add(application._id);
  }
}

function startApplicationPoller(client) {
  setInterval(() => {
    const guilds = store.allGuilds();
    for (const [guildId, guildConfig] of Object.entries(guilds)) {
      pollGuild(client, guildId, guildConfig).catch((error) => {
        console.error(`Application poll failed for guild ${guildId}:`, error);
      });
    }
  }, POLL_INTERVAL_MS);
}

module.exports = { startApplicationPoller };
