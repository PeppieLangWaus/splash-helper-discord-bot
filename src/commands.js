const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require("discord.js");
const displayComponents = require("./display-components");
const embedComponents = require("./embed-components");
const setupCommand = require("./commands/setup");
const linkCommand = require("./commands/link");

function parseHexColor(raw) {
  if (!raw) {
    return null;
  }

  const normalized = raw.trim().replace(/^#/, "");
  if (!/^[A-Fa-f0-9]{6}$/.test(normalized)) {
    return null;
  }

  return Number.parseInt(normalized, 16);
}

function buildPreviewEmbed(interaction) {
  const title = interaction.options.getString("title", true);
  const description = interaction.options.getString("description", true);
  const colorRaw = interaction.options.getString("color");
  const url = interaction.options.getString("url");
  const thumbnail = interaction.options.getString("thumbnail");
  const image = interaction.options.getString("image");
  const footer = interaction.options.getString("footer");
  const includeTimestamp = interaction.options.getBoolean("timestamp") ?? false;

  const embed = new EmbedBuilder().setTitle(title).setDescription(description);

  const parsedColor = parseHexColor(colorRaw);
  if (parsedColor !== null) {
    embed.setColor(parsedColor);
  }

  if (url) {
    embed.setURL(url);
  }

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  if (image) {
    embed.setImage(image);
  }

  if (footer) {
    embed.setFooter({ text: footer });
  }

  if (includeTimestamp) {
    embed.setTimestamp(new Date());
  }

  return { embed, colorRaw };
}

function parseEmbedJson(rawText) {
  const parsed = JSON.parse(rawText);
  let candidate = parsed;

  if (Array.isArray(candidate)) {
    candidate = candidate[0];
  }

  if (candidate && typeof candidate === "object" && candidate.embed) {
    candidate = candidate.embed;
  }

  if (!candidate || typeof candidate !== "object") {
    throw new Error("JSON must resolve to an embed object.");
  }

  return EmbedBuilder.from(candidate);
}

function findTemplate(templates, name) {
  if (!name) {
    return templates[0];
  }

  const normalized = name.trim().toLowerCase();
  return templates.find((template) => template.name.toLowerCase() === normalized);
}

const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("embed-preview")
      .setDescription("Preview an embed using slash command options")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Embed title")
          .setRequired(true)
          .setMaxLength(256)
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Embed description")
          .setRequired(true)
          .setMaxLength(4096)
      )
      .addStringOption((option) =>
        option
          .setName("color")
          .setDescription("Hex color like #1ABC9C")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("url")
          .setDescription("Title URL")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("thumbnail")
          .setDescription("Thumbnail image URL")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("image")
          .setDescription("Main image URL")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("footer")
          .setDescription("Footer text")
          .setRequired(false)
          .setMaxLength(2048)
      )
      .addBooleanOption((option) =>
        option
          .setName("timestamp")
          .setDescription("Add the current timestamp")
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("ephemeral")
          .setDescription("Only show the preview to you (default true)")
          .setRequired(false)
      ),
    async execute(interaction) {
      const ephemeral = interaction.options.getBoolean("ephemeral") ?? true;
      const { embed, colorRaw } = buildPreviewEmbed(interaction);

      if (colorRaw && parseHexColor(colorRaw) === null) {
        await interaction.reply({
          content: "Invalid color. Use a 6-digit hex value like #1ABC9C.",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({ embeds: [embed], ephemeral });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("embed-json")
      .setDescription("Preview an embed from JSON")
      .addStringOption((option) =>
        option
          .setName("json")
          .setDescription("Embed JSON object")
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("ephemeral")
          .setDescription("Only show the preview to you (default true)")
          .setRequired(false)
      ),
    async execute(interaction) {
      const jsonText = interaction.options.getString("json", true);
      const ephemeral = interaction.options.getBoolean("ephemeral") ?? true;

      try {
        const embed = parseEmbedJson(jsonText);
        await interaction.reply({ embeds: [embed], ephemeral });
      } catch (error) {
        await interaction.reply({
          content:
            "Invalid JSON payload. Pass a valid embed object (or {\"embed\": {...}}).",
          ephemeral: true,
        });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("embed-help")
      .setDescription("Show quick usage examples for embed testing"),
    async execute(interaction) {
      const example =
        '{"title":"Build Complete","description":"Deployment succeeded.","color":65280}';

      await interaction.reply({
        ephemeral: true,
        content:
          "Use /embed-preview for form-style testing or /embed-json for raw payload testing.\n" +
          `Example JSON: ${example}`,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("display-test")
      .setDescription("Display a test display component template")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Display component name (defaults to the first template)")
          .setRequired(false)
      ),
    async execute(interaction) {
      const selectedName = interaction.options.getString("name");
      const component = findTemplate(displayComponents, selectedName);

      if (!component) {
        const validNames = displayComponents.map((entry) => entry.name).join(", ");
        await interaction.reply({
          content: `Unknown display component \"${selectedName}\". Available: ${validNames}`,
          ephemeral: true,
        });
        return;
      }

      const container = component.buildComponent();
      await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("embed-test")
      .setDescription("Display a test embed template")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Embed template name (defaults to the first template)")
          .setRequired(false)
      ),
    async execute(interaction) {
      const selectedName = interaction.options.getString("name");
      const template = findTemplate(embedComponents, selectedName);

      if (!template) {
        const validNames = embedComponents.map((entry) => entry.name).join(", ");
        await interaction.reply({
          content: `Unknown embed template \"${selectedName}\". Available: ${validNames}`,
          ephemeral: true,
        });
        return;
      }

      const embed = template.buildEmbed();
      await interaction.reply({ embeds: [embed] });
    },
  },
  setupCommand,
  linkCommand,
];

module.exports = commands;
