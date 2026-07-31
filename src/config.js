const dotenv = require("dotenv");

dotenv.config();

function getEnv(name, required = true) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    if (required) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return undefined;
  }
  return value.trim();
}

const config = {
  token: getEnv("DISCORD_TOKEN"),
  clientId: getEnv("CLIENT_ID"),
  guildId: getEnv("GUILD_ID", false),
  backendBaseUrl: getEnv("BACKEND_BASE_URL"),
  storePath: getEnv("BOT_STORE_PATH", false),
};

module.exports = config;
