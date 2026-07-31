const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  RoleSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");
const backendApi = require("./backendApi");
const store = require("./store");

// One entry per Discord server being set up right now, keyed by (guildId, discordUserId) so
// the same person running /setup in two different servers at once never cross-contaminates
// state. In-memory only — if the bot restarts mid-wizard, the owner just reruns /setup.
const wizardState = new Map();

function stateKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

const STEPS = [
  { type: "roles" },
  { type: "channel", key: "supportTicketChannelId", label: "support ticket channel" },
  { type: "autoadd" },
  { type: "channel", key: "splasherLinkChannelId", label: "splasher-link ticket channel" },
  { type: "channel", key: "historyChannelId", label: "splasher history channel" },
  { type: "channel", key: "activeWorldsChannelId", label: "active worlds channel" },
];

function renderRoles() {
  return {
    content: "Which roles should be able to see support channels? (select up to 5)",
    embeds: [],
    components: [
      new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId("setup:roles").setMinValues(1).setMaxValues(5),
      ),
    ],
  };
}

function renderAutoAdd() {
  return {
    content: "Should splashers who link/apply be added automatically, or require staff approval first?",
    embeds: [],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("setup:autoadd:true").setLabel("Auto-add").setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("setup:autoadd:false")
          .setLabel("Require staff approval")
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

function renderChannelChoice(stepIndex, label) {
  return {
    content: `Where should the **${label}** be? Create a new one, or choose an existing text channel.`,
    embeds: [],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`setup:ch:${stepIndex}:create`)
          .setLabel("Create channel for me")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`setup:ch:${stepIndex}:choose`)
          .setLabel("Choose existing channel")
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

function renderChannelSelect(stepIndex, label) {
  return {
    content: `Select the **${label}**.`,
    embeds: [],
    components: [
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`setup:ch:${stepIndex}:select`)
          .addChannelTypes(ChannelType.GuildText),
      ),
    ],
  };
}

function renderStep(stepIndex) {
  const step = STEPS[stepIndex];
  if (!step) return null;
  if (step.type === "roles") return renderRoles();
  if (step.type === "autoadd") return renderAutoAdd();
  return renderChannelChoice(stepIndex, step.label);
}

function channelName(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "splash-helper";
}

async function goToStep(interaction, state, stepIndex) {
  state.step = stepIndex;
  const payload = renderStep(stepIndex);
  if (payload) {
    await interaction.update(payload);
    return;
  }
  await finishSetup(interaction, state);
}

async function finishSetup(interaction, state) {
  const discordConfig = {
    guildId: interaction.guildId,
    supportRoleIds: state.collected.supportRoleIds ?? [],
    supportTicketChannelId: state.collected.supportTicketChannelId,
    splasherLinkChannelId: state.collected.splasherLinkChannelId,
    historyChannelId: state.collected.historyChannelId,
    activeWorldsChannelId: state.collected.activeWorldsChannelId,
    autoAddSplashers: !!state.collected.autoAddSplashers,
  };

  await backendApi.putDiscordConfig(state.apiToken, discordConfig);
  store.setGuild(interaction.guildId, { communityId: state.communityId, apiToken: state.apiToken });

  const embed = new EmbedBuilder()
    .setTitle("Splash Helper setup complete")
    .setColor(0x1e3a5f)
    .setDescription(`This server is now linked to **${state.communityName}**.`)
    .addFields(
      { name: "Auto-add splashers", value: discordConfig.autoAddSplashers ? "Yes" : "No — staff approval required" },
      {
        name: "Support roles",
        value: discordConfig.supportRoleIds.length
          ? discordConfig.supportRoleIds.map((id) => `<@&${id}>`).join(", ")
          : "None",
      },
      { name: "Support ticket channel", value: `<#${discordConfig.supportTicketChannelId}>` },
      { name: "Splasher-link channel", value: `<#${discordConfig.splasherLinkChannelId}>` },
      { name: "History channel", value: `<#${discordConfig.historyChannelId}>` },
      { name: "Active worlds channel", value: `<#${discordConfig.activeWorldsChannelId}>` },
    );

  await interaction.update({ content: "", embeds: [embed], components: [] });
  wizardState.delete(stateKey(interaction.guildId, interaction.user.id));
}

async function handleModalSubmit(interaction) {
  const communityName = interaction.fields.getTextInputValue("communityName");
  const apiToken = interaction.fields.getTextInputValue("apiToken");

  let result;
  try {
    result = await backendApi.verifySetup({
      communityName,
      apiToken,
      guildId: interaction.guildId,
      discordUserId: interaction.user.id,
    });
  } catch (error) {
    const message = error.body?.error || "Could not verify that community name and API token.";
    await interaction.reply({ content: message, ephemeral: true });
    return;
  }

  const key = stateKey(interaction.guildId, interaction.user.id);
  wizardState.set(key, {
    communityId: result.communityId,
    communityName: result.communityName,
    apiToken,
    step: 0,
    collected: {},
  });

  await interaction.reply({ content: `Setting up **${result.communityName}** for this server.`, ephemeral: true });
  await interaction.followUp({ ...renderStep(0), ephemeral: true });
}

async function handleInteraction(interaction) {
  const { customId } = interaction;
  if (!customId?.startsWith("setup:")) return false;

  if (customId === "setup:modal" && interaction.isModalSubmit()) {
    await handleModalSubmit(interaction);
    return true;
  }

  const key = stateKey(interaction.guildId, interaction.user.id);
  const state = wizardState.get(key);
  if (!state) {
    await interaction.reply({ content: "This setup session has expired — run /setup again.", ephemeral: true });
    return true;
  }

  if (customId === "setup:roles" && interaction.isRoleSelectMenu()) {
    state.collected.supportRoleIds = interaction.values;
    await goToStep(interaction, state, state.step + 1);
    return true;
  }

  const autoAddMatch = customId.match(/^setup:autoadd:(true|false)$/);
  if (autoAddMatch && interaction.isButton()) {
    state.collected.autoAddSplashers = autoAddMatch[1] === "true";
    await goToStep(interaction, state, state.step + 1);
    return true;
  }

  const channelMatch = customId.match(/^setup:ch:(\d+):(create|choose|select)$/);
  if (channelMatch) {
    const stepIndex = Number(channelMatch[1]);
    const action = channelMatch[2];
    const step = STEPS[stepIndex];
    if (!step) return true;

    if (action === "create" && interaction.isButton()) {
      const channel = await interaction.guild.channels.create({
        name: channelName(step.label),
        type: ChannelType.GuildText,
      });
      state.collected[step.key] = channel.id;
      await goToStep(interaction, state, stepIndex + 1);
    } else if (action === "choose" && interaction.isButton()) {
      await interaction.update(renderChannelSelect(stepIndex, step.label));
    } else if (action === "select" && interaction.isChannelSelectMenu()) {
      state.collected[step.key] = interaction.values[0];
      await goToStep(interaction, state, stepIndex + 1);
    }
    return true;
  }

  return true;
}

module.exports = { handleInteraction };
