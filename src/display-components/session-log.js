const { ContainerBuilder } = require("discord.js");

const SAMPLE_ENTRY = {
  finalizedTimestamp: Date.now(),
  session: {
    world: 361,
    spell: "Fire Strike",
    spellsCast: 4820,
    startMagicXp: 6_015_213,
    currentMagicXp: 6_112_889,
    runeCostGp: 96_400,
    averagePlayerCount: 3.2,
    stickyKnight: false,
  },
};

module.exports = {
  name: "session-log",
  description: "Archived-session summary, posted to a splasher's history thread",
  buildComponent(entry = SAMPLE_ENTRY) {
    const { session } = entry;
    const xpGained = session.currentMagicXp - session.startMagicXp;
    const finalizedSeconds = Math.floor(entry.finalizedTimestamp / 1000);

    return new ContainerBuilder()
      .setAccentColor(0x1abc9c)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(`## Archived session\n<t:${finalizedSeconds}:f>`)
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**World:** ${session.world}\n` +
            `**Spell:** ${session.spell}\n` +
            `**Spells cast:** ${session.spellsCast.toLocaleString()}\n` +
            `**Magic XP gained:** ${xpGained.toLocaleString()}\n` +
            `**Rune cost:** ${session.runeCostGp.toLocaleString()} gp\n` +
            `**Avg players:** ${session.averagePlayerCount.toFixed(1)}\n` +
            `**Sticky Knight:** ${session.stickyKnight ? "Yes" : "No"}`
        )
      );
  },
};
