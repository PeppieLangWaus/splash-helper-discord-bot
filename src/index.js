const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const config = require("./config");
const commands = require("./commands");
const setupWizard = require("./setupWizard");
const tickets = require("./tickets");
const bankTickets = require("./bankTickets");
const linkCommand = require("./commands/link");
const { startApplicationPoller } = require("./applicationPoller");
const { startActiveWorldsPoster } = require("./activeWorldsPoster");
const { startSessionHistoryPoster } = require("./sessionHistoryPoster");

// GuildMessages (non-privileged) is needed so awaitMessages collectors (used to collect
// deposit/withdraw/payout screenshots) can see MessageCreate events at all. Message content
// itself is read only from replies to the bot's own prompt messages, one of Discord's
// documented exceptions delivered without the privileged Message Content intent.
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();

for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  startApplicationPoller(readyClient);
  startActiveWorldsPoster(readyClient);
  startSessionHistoryPoster(readyClient);
});

async function replyWithError(interaction, message) {
  const payload = { content: message, ephemeral: true };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Command execution failed:", error);
      await replyWithError(interaction, "Something went wrong while running that command.");
    }
    return;
  }

  const customId = interaction.customId;
  if (typeof customId !== "string") return;

  try {
    if (customId.startsWith("setup:")) {
      await setupWizard.handleInteraction(interaction);
      return;
    }
    if (customId.startsWith("ticket:")) {
      await tickets.handleResolveButton(interaction);
      return;
    }
    if (customId.startsWith("bank:")) {
      await bankTickets.handleInteraction(interaction);
      return;
    }
    if (customId === "link:modal" && interaction.isModalSubmit()) {
      await linkCommand.handleModalSubmit(interaction);
      return;
    }
  } catch (error) {
    console.error("Interaction handling failed:", error);
    await replyWithError(interaction, "Something went wrong handling that.");
  }
});

client.login(config.token);
