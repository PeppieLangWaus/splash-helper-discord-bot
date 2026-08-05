const { MessageFlags, ThreadAutoArchiveDuration } = require("discord.js");
const store = require("./store");
const backendApi = require("./backendApi");
const sessionLogDisplay = require("./display-components/session-log");

const POLL_INTERVAL_MS = 30 * 1000;
const THREAD_NAME_MAX_LENGTH = 100;

/** Finds this guild's history thread for a splasher, creating it under the configured history
 *  channel the first time we see that username. Thread ids are cached on guildConfig.historyThreads
 *  (persisted to the store) so later polls reuse the same thread instead of creating a new one —
 *  sending to an archived thread un-archives it automatically, so no extra bookkeeping is needed. */
async function getOrCreateSplasherThread(channel, guildId, guildConfig, username) {
  const existingThreadId = guildConfig.historyThreads?.[username];
  if (existingThreadId) {
    const existing = await channel.client.channels.fetch(existingThreadId).catch(() => null);
    if (existing?.isThread()) return existing;
  }

  const thread = await channel.threads.create({
    name: username.slice(0, THREAD_NAME_MAX_LENGTH),
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    reason: `Session history thread for ${username}`,
  });

  const historyThreads = { ...(guildConfig.historyThreads ?? {}), [username]: thread.id };
  guildConfig.historyThreads = historyThreads;
  store.patchGuild(guildId, { historyThreads });

  return thread;
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
  const threadCache = new Map();
  let latestFinalized = since;
  for (const entry of result.sessions) {
    try {
      let thread = threadCache.get(entry.username);
      if (!thread) {
        thread = await getOrCreateSplasherThread(channel, guildId, guildConfig, entry.username);
        threadCache.set(entry.username, thread);
      }
      await thread.send({
        components: [sessionLogDisplay.buildComponent(entry)],
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
  // Per-guild thread creation can be slow (thread creation is rate-limited), so a single poll
  // can outlast POLL_INTERVAL_MS. Without this guard, an overlapping tick would re-fetch and
  // re-post the same batch before lastHistorySyncAt from the first run had been persisted.
  const inFlightGuildIds = new Set();

  const tick = () => {
    const guilds = store.allGuilds();
    for (const [guildId, guildConfig] of Object.entries(guilds)) {
      if (inFlightGuildIds.has(guildId)) continue;
      inFlightGuildIds.add(guildId);
      pollGuild(client, guildId, guildConfig)
        .catch((error) => {
          console.error(`Session history poll failed for guild ${guildId}:`, error);
        })
        .finally(() => inFlightGuildIds.delete(guildId));
    }
  };

  tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

module.exports = { startSessionHistoryPoster };
