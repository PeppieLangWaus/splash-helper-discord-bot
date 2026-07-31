const { ContainerBuilder, MessageFlags } = require("discord.js");
const store = require("./store");
const backendApi = require("./backendApi");

const POLL_INTERVAL_MS = 30 * 1000;

function buildSessionHistoryContainer(entry) {
  const { username, session } = entry;
  const xpGained = session.currentMagicXp - session.startMagicXp;
  const finalizedSeconds = Math.floor(entry.finalizedTimestamp / 1000);

  return new ContainerBuilder()
    .setAccentColor(0x1abc9c)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`## Archived session — ${username}\n<t:${finalizedSeconds}:f>`)
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `**World:** ${session.world}\n` +
          `**Spell:** ${session.spell}\n` +
          `**Spells cast:** ${session.spellsCast.toLocaleString()}\n` +
          `**Magic XP gained:** ${xpGained.toLocaleString()}\n` +
          `**Rune cost:** ${session.runeCostGp.toLocaleString()} gp\n` +
          `**Avg players:** ${session.averagePlayerCount.toFixed(1)}\n` +
          `**Sticky Knight:** ${session.stickyKnight ? "Yes" : "No"}`
      )
    );
}

async function postGuildHistory(client, guildId, guildConfig, discordConfig) {
  const channelId = discordConfig?.historyChannelId;
  if (!channelId) return;

  const since = guildConfig.lastHistorySyncAt ?? 0;
  const result = await backendApi.getSessionHistory(guildConfig.apiToken, since).catch(() => null);
  if (!result || result.sessions.length === 0) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  // Sent strictly in order, and the cursor only advances past entries that were actually
  // posted — a failure stops the batch so the next poll retries from the right place instead
  // of skipping the entry that failed.
  let latestFinalized = since;
  for (const entry of result.sessions) {
    try {
      await channel.send({
        components: [buildSessionHistoryContainer(entry)],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      console.error(`Failed to send session history message for guild ${guildId}:`, error);
      break;
    }
    latestFinalized = Math.max(latestFinalized, entry.finalizedTimestamp);
  }

  if (latestFinalized > since) {
    store.patchGuild(guildId, { lastHistorySyncAt: latestFinalized });
  }
}

async function pollGuild(client, guildId, guildConfig) {
  const configResult = await backendApi.getDiscordConfig(guildConfig.apiToken).catch(() => null);
  await postGuildHistory(client, guildId, guildConfig, configResult?.config);
}

function startSessionHistoryPoster(client) {
  const tick = () => {
    const guilds = store.allGuilds();
    for (const [guildId, guildConfig] of Object.entries(guilds)) {
      pollGuild(client, guildId, guildConfig).catch((error) => {
        console.error(`Session history poll failed for guild ${guildId}:`, error);
      });
    }
  };

  tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

module.exports = { startSessionHistoryPoster, buildSessionHistoryContainer };
