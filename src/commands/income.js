const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");
const store = require("../store");
const backendApi = require("../backendApi");
const { formatGp } = require("../gp");
const { buildPayoutButtons } = require("../bankTickets");

async function handleBalance(interaction, guildConfig) {
  const result = await backendApi.getIncome(guildConfig.apiToken, interaction.user.id).catch(() => null);
  if (!result?.linked) {
    await interaction.reply({
      content: "You haven't linked your Splash Helper account yet — run /link first.",
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${result.username}'s income`)
    .setColor(0x1e3a5f)
    .addFields(
      { name: "Total earned", value: `${formatGp(result.totalEarnedGp)} gp`, inline: true },
      { name: "Paid out", value: `${formatGp(result.totalPaidOutGp)} gp`, inline: true },
      { name: "Available", value: `${formatGp(result.availableGp)} gp`, inline: true },
      { name: "Minimum payout", value: `${formatGp(result.minPayoutGp)} gp` },
    )
    .setDescription("**Commands**\n`/income balance` — view your earnings\n`/income payout` — request a payout");

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handlePayout(interaction, guildConfig) {
  let result;
  try {
    result = await backendApi.requestPayout(guildConfig.apiToken, interaction.user.id);
  } catch (error) {
    if (error.body?.availableGp !== undefined) {
      await interaction.reply({
        ephemeral: true,
        content: `You need at least **${formatGp(error.body.minPayoutGp)} gp** to request a payout — you currently have **${formatGp(error.body.availableGp)} gp** available.`,
      });
      return;
    }
    await interaction.reply({
      ephemeral: true,
      content: error.body?.error || "Could not start a payout. Have you run /link yet?",
    });
    return;
  }

  const { config } = await backendApi.getDiscordConfig(guildConfig.apiToken).catch(() => ({ config: null }));
  const ticketChannel = config?.supportTicketChannelId
    ? await interaction.guild.channels.fetch(config.supportTicketChannelId).catch(() => null)
    : null;

  if (!ticketChannel?.isTextBased()) {
    await interaction.reply({
      ephemeral: true,
      content: "Payout requested, but no support ticket channel is configured — ask an admin to run /setup.",
    });
    return;
  }

  const thread = await ticketChannel.threads.create({
    name: `payout-${interaction.user.username}`.slice(0, 90),
    type: ChannelType.PrivateThread,
    reason: `Payout request from ${interaction.user.tag}`,
  });
  await thread.members.add(interaction.user.id).catch(() => {});

  const bankManagerMentions = (config?.bankManagerRoleIds ?? []).map((id) => `<@&${id}>`).join(" ");
  await thread.send({
    content:
      `${interaction.user} is requesting a payout of **${formatGp(result.ticket.amountGp)}**.` +
      (bankManagerMentions ? ` ${bankManagerMentions}` : ""),
    components: [buildPayoutButtons(result.ticket._id)],
  });

  await interaction.reply({ content: `Payout requested — ${thread}`, ephemeral: true });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("income")
    .setDescription("View or pay out what you've earned splashing")
    .addSubcommand((sub) => sub.setName("balance").setDescription("View how much you've earned splashing"))
    .addSubcommand((sub) => sub.setName("payout").setDescription("Request a payout of your available gp")),
  async execute(interaction) {
    const guildConfig = store.getGuild(interaction.guildId);
    if (!guildConfig) {
      await interaction.reply({
        content: "This server hasn't run /setup yet — ask a server admin to set it up first.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    if (sub === "balance") {
      await handleBalance(interaction, guildConfig);
    } else if (sub === "payout") {
      await handlePayout(interaction, guildConfig);
    }
  },
};
