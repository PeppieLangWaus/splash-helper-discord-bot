const { ContainerBuilder, MessageFlags } = require("discord.js");
const store = require("./store");
const backendApi = require("./backendApi");

const POLL_INTERVAL_MS = 20 * 1000;
const UNKNOWN_MESSAGE = 10008;

function formatDuration(startTime) {
  const startMs = Date.parse(startTime);
  if (Number.isNaN(startMs)) return "unknown";

  const totalMinutes = Math.max(0, Math.floor((Date.now() - startMs) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function buildActiveWorldsContainer(sessions) {
  const container = new ContainerBuilder().setAccentColor(0x3498db);
  const count = sessions.length === 1 ? "1 active splasher" : `${sessions.length} active splashers`;

  container.addTextDisplayComponents((textDisplay) =>
    textDisplay.setContent(`## Active Worlds\n-# ${count} • updated <t:${Math.floor(Date.now() / 1000)}:R>`)
  );
  container.addSeparatorComponents((separator) => separator);

  if (sessions.length === 0) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent("No one is currently splashing.")
    );
    return container;
  }

  for (const { username, session } of sessions) {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `**${username}** — World ${session.world}\n` +
          `Spell: ${session.spell} • Players: ${session.averagePlayerCount.toFixed(1)} avg • ` +
          `Duration: ${formatDuration(session.startTime)}`
      )
    );
  }

  return container;
}

async function postGuild(client, guildId, guildConfig, discordConfig) {
  const channelId = discordConfig?.activeWorldsChannelId;
  if (!channelId) return;

  const result = await backendApi.getActiveSessions(guildConfig.apiToken).catch(() => null);
  if (!result) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const payload = {
    components: [buildActiveWorldsContainer(result.sessions)],
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
      // The tracked message was deleted out from under us — fall through and send a new one.
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

module.exports = { startActiveWorldsPoster, buildActiveWorldsContainer };
