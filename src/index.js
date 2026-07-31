const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} = require("discord.js");
const config = require("./config");
const commands = require("./commands");
const displayComponents = require("./display-components");
const setupWizard = require("./setupWizard");
const tickets = require("./tickets");
const { startApplicationPoller } = require("./applicationPoller");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  const channelId = config.startupSplashingContestChannelId;
  if (!channelId) {
    console.log(
      "Startup splashing contest post skipped: STARTUP_SPLASHING_CONTEST_CHANNEL_ID is not set."
    );
    return;
  }

  const template = displayComponents.find(
    (entry) => entry.name === "splashing-contest"
  );

  if (!template) {
    console.warn(
      "Startup splashing contest post skipped: template 'splashing-contest' not found."
    );
    return;
  }

  try {
    const channel = await readyClient.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      console.warn(
        `Startup splashing contest post skipped: channel ${channelId} is missing or not text-based.`
      );
      return;
    }

    const container = template.buildComponent();
    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    console.log(
      `Posted startup splashing contest message to channel ${channelId}.`
    );
  } catch (error) {
    console.error("Failed to post startup splashing contest message:", error);
  }

  startApplicationPoller(readyClient);
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
  } catch (error) {
    console.error("Interaction handling failed:", error);
    await replyWithError(interaction, "Something went wrong handling that.");
  }
});

client.login(config.token);
