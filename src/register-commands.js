const { REST, Routes } = require("discord.js");
const config = require("./config");
const commands = require("./commands");

const rest = new REST({ version: "10" }).setToken(config.token);
const body = commands.map((command) => command.data.toJSON());

async function register() {
  if (config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body,
    });
    console.log(`Registered ${body.length} guild command(s) to ${config.guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body });
  console.log(`Registered ${body.length} global command(s).`);
}

register().catch((error) => {
  console.error("Command registration failed:", error);
  process.exitCode = 1;
});
