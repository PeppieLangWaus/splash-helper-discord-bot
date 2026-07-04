# Splash Helper Discord Bot

Discord.js bot for viewing and testing embed messages.

## Features

- `/embed-preview`: Build an embed from slash-command options
- `/embed-json`: Preview an embed directly from a JSON payload
- `/embed-help`: Quick usage examples
- Secure token handling via `.env` and `dotenv`

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
