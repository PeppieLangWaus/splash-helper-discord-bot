# Splash Helper Discord Bot

Discord.js bot for community server integration (setup, splasher account linking, application
tickets) and for viewing/testing embed messages.

## Features

- `/setup`: Server-owner-only wizard that links this server to a Splash Helper community —
  paste the community's name + API token (from Account Settings on the website), pick which
  roles can see support channels, choose/create the support ticket, splasher-link, history, and
  active-worlds channels, and whether splashers are auto-added or need staff approval.
- `/link`: Any member can link their Splash Helper account (verified by plugin token + RSN) in
  a private thread, and either gets added immediately or gets an approval ticket with
  Approve/Reject buttons for staff.
- Website-submitted splasher applications are picked up automatically (polling every 60s) and
  posted as tickets in the support ticket channel with the same Approve/Reject buttons.
- Active worlds channel: a single component-based message listing the community's currently
  active splash sessions, kept up to date in place (edited every ~20s, never duplicated).
- History channel: a thread per linked splasher (created on first session, reused after), with
  one component-based message posted to that splasher's thread as soon as a session is finalized
  (polled every ~30s).
- `/embed-preview`: Build an embed from slash-command options
- `/embed-json`: Preview an embed directly from a JSON payload
- `/embed-help`: Quick usage examples
- `/display-test [name]`: Show a display component template by name (defaults to first)
- `/embed-test [name]`: Show an embed template by name (defaults to first)
- Display templates are in `src/display-components/`
- Embed templates are in `src/embed-components/`
- Secure token handling via `.env` and `dotenv`

## Architecture

The bot keeps almost no state of its own. The only thing it persists locally (`data/guilds.json`
by default, or `BOT_STORE_PATH`) is `{guildId: {communityId, apiToken}}` — it needs to know
which community token to use for a guild *before* it can ask the backend anything. Everything
else (channel IDs, support roles, auto-add setting, pending applications) lives in
`splash-helper-backend` under the community, fetched/written via the community's own API token
through the `/community-bot/*` routes. See `src/backendApi.js`, `src/store.js`,
`src/setupWizard.js`, and `src/tickets.js`.

The active-worlds and history channel posters (`src/activeWorldsPoster.js`,
`src/sessionHistoryPoster.js`) each poll `/community-bot/active-sessions` and
`/community-bot/sessions/history` per guild. The only extra state they keep locally (in the
same per-guild store) is the active-worlds message id (so it's edited in place instead of
duplicated), a `since` cursor for history (so a session is only posted once), and a map of
splasher username → thread id under the history channel (so each splasher's thread is created
once and reused, rather than re-created on every poll).

## Prerequisites

- Node.js 18+
- A Discord application with a bot user

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local env file:

   ```bash
   copy .env.example .env
   ```

3. Fill in values in `.env`:

   - `DISCORD_TOKEN`: Bot token from Discord Developer Portal
   - `CLIENT_ID`: Application (bot) client ID
   - `GUILD_ID`: Test server ID (recommended for instant command updates)
   - `BACKEND_BASE_URL`: Base URL of `splash-helper-backend` (e.g. `http://localhost:3000`)
   - `BOT_STORE_PATH`: Optional path for the per-guild community/token store (defaults to `./data/guilds.json`)

4. Register slash commands:

   ```bash
   npm run register-commands
   ```

5. Start the bot:

   ```bash
   npm start
   ```

## Notes

- Keep `.env` private. It is ignored by git through `.gitignore`.
- If `GUILD_ID` is omitted, commands are registered globally and can take time to appear.

## Example `/embed-json`

Use this as the `json` option value:

```json
{"title":"Build Complete","description":"Deployment succeeded.","color":65280}
```
