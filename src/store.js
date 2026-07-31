const fs = require("node:fs");
const path = require("node:path");
const config = require("./config");

const STORE_PATH = config.storePath
  ? path.resolve(config.storePath)
  : path.join(__dirname, "..", "data", "guilds.json");

/**
 * Minimal per-guild persistence: {guildId: {communityId, apiToken, updatedAt}}. This is the
 * only state the bot keeps of its own — everything else (channel IDs, roles, auto-add) lives
 * in the backend under DiscordServerConfig, fetched by the community's own token. The bot
 * needs *this* mapping locally because it has to know which token to use for a guild before
 * it can ask the backend anything.
 */
function readAll() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

function writeAll(data) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function getGuild(guildId) {
  return readAll()[guildId] ?? null;
}

// Merges rather than overwrites, so re-running /setup (which only ever supplies
// communityId/apiToken) doesn't wipe poller state like activeWorldsMessageId or
// lastHistorySyncAt that other parts of the bot have since patched onto this guild.
function setGuild(guildId, { communityId, apiToken }) {
  const all = readAll();
  const existing = all[guildId] ?? {};
  all[guildId] = { ...existing, communityId, apiToken, updatedAt: new Date().toISOString() };
  writeAll(all);
}

/** Merges an arbitrary partial patch into a guild's stored state — used by the active-worlds
 *  and session-history pollers to persist their own small bits of state (message ids, sync
 *  cursors) alongside the communityId/apiToken set by /setup. */
function patchGuild(guildId, patch) {
  const all = readAll();
  const existing = all[guildId] ?? {};
  all[guildId] = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  writeAll(all);
}

function allGuilds() {
  return readAll();
}

module.exports = { getGuild, setGuild, patchGuild, allGuilds };
