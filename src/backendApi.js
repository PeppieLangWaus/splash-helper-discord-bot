const config = require("./config");

/**
 * Thin fetch client for the splash-helper-backend `/community-bot/*` routes. The community
 * API token is always passed explicitly per call (never cached module-level) so a request
 * for one guild can never accidentally reuse another guild's credentials.
 */
async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Community-Token"] = token;

  const res = await fetch(`${config.backendBaseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request to ${path} failed with status ${res.status}`);
    error.status = res.status;
    error.body = data;
    throw error;
  }
  return data;
}

/** Bootstrap handshake for /setup — not community-token-authenticated, since the bot doesn't
 *  have a trusted token for this guild yet. Any name/token mismatch gets logged server-side. */
function verifySetup({ communityName, apiToken, guildId, discordUserId }) {
  return request("/community-bot/verify-setup", {
    method: "POST",
    body: { communityName, apiToken, guildId, discordUserId },
  });
}

function getDiscordConfig(token) {
  return request("/community-bot/discord-config", { token });
}

function putDiscordConfig(token, discordConfig) {
  return request("/community-bot/discord-config", { method: "PUT", token, body: discordConfig });
}

function getPendingApplications(token) {
  return request("/community-bot/applications?status=pending", { token });
}

function resolveApplication(token, applicationId, approve) {
  return request(`/community-bot/applications/${applicationId}/resolve`, {
    method: "POST",
    token,
    body: { approve },
  });
}

function linkAccount(token, { pluginToken, rsn, discordUserId }) {
  return request("/community-bot/link-account", {
    method: "POST",
    token,
    body: { token: pluginToken, rsn, discordUserId },
  });
}

function getActiveSessions(token) {
  return request("/community-bot/active-sessions", { token });
}

function getSessionHistory(token, since) {
  const query = since ? `?since=${since}` : "";
  return request(`/community-bot/sessions/history${query}`, { token });
}

function getIncome(token, discordUserId) {
  return request(`/community-bot/income?discordUserId=${encodeURIComponent(discordUserId)}`, { token });
}

function requestPayout(token, discordUserId) {
  return request("/community-bot/income/payout", { method: "POST", token, body: { discordUserId } });
}

function getBank(token) {
  return request("/community-bot/bank", { token });
}

function createBankTicket(token, { type, amountGp, discordUserId, discordUsername }) {
  return request("/community-bot/bank/tickets", {
    method: "POST",
    token,
    body: { type, amountGp, discordUserId, discordUsername },
  });
}

function resolveBankTicket(token, ticketId, { approve, screenshotUrl, authorizedByDiscordId, authorizedByUsername }) {
  return request(`/community-bot/bank/tickets/${ticketId}/resolve`, {
    method: "POST",
    token,
    body: { approve, screenshotUrl, authorizedByDiscordId, authorizedByUsername },
  });
}

module.exports = {
  verifySetup,
  getDiscordConfig,
  putDiscordConfig,
  getPendingApplications,
  resolveApplication,
  linkAccount,
  getActiveSessions,
  getSessionHistory,
  getIncome,
  requestPayout,
  getBank,
  createBankTicket,
  resolveBankTicket,
};
