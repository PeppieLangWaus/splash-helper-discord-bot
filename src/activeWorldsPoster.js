const { MessageFlags } = require("discord.js");
const store = require("./store");
const backendApi = require("./backendApi");
const activeWorldsDisplay = require("./display-components/active-worlds");

const POLL_INTERVAL_MS = 20 * 1000;
const UNKNOWN_MESSAGE = 10008;

async function postGuild(client, guildId, guildConfig, discordConfig) {
  const channelId = discordConfig?.activeWorldsChannelId;
  if (!channelId) return;

  const result = await backendApi.getActiveSessions(guildConfig.apiToken).catch(() => null);
  if (!result) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const payload = {
    components: [activeWorldsDisplay.buildComponent(result.sessions)],
    flags: MessageFlags.IsComponentsV2,
  };

  if (guildConfig.activeWorldsMessageId) {
    try {
      await channel.messages.edit(guildConfig.activeWorldsMessageId, payload);
      return;
    } catch (error) {
      if (error.code !== UNKNOWN_MESSAGE) {
        console.error(`Failed to edit active worlds message for guild ${guildId}:`, error);
        return;
      }
    }
  }

  const message = await channel.send(payload).catch((error) => {
    console.error(`Failed to send active worlds message for guild ${guildId}:`, error);
    return null;
  });
  if (message) {
    store.patchGuild(guildId, { activeWorldsMessageId: message.id });
  }
}

async function pollGuild(client, guildId, guildConfig) {
  const configResult = await backendApi.getDiscordConfig(guildConfig.apiToken).catch(() => null);
  await postGuild(client, guildId, guildConfig, configResult?.config);
}

function startActiveWorldsPoster(client) {
  const tick = () => {
    const guilds = store.allGuilds();
    for (const [guildId, guildConfig] of Object.entries(guilds)) {
      pollGuild(client, guildId, guildConfig).catch((error) => {
        console.error(`Active worlds poll failed for guild ${guildId}:`, error);
      });
    }
  };

  tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

module.exports = { startActiveWorldsPoster };
