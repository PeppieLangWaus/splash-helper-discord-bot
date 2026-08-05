const { ContainerBuilder } = require("discord.js");
const { getWorldFlag } = require("../worldLocations");
const { getSpellIcon } = require("../spells");

const SAMPLE_SESSIONS = [
  {
    username: "PeppieSplash",
    session: {
      world: 361,
      spell: "Fire Strike",
      averagePlayerCount: 3.2,
      startTime: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    },
  },
  {
    username: "ExampleSplasher",
    session: {
      world: 337,
      spell: "Wind Strike",
      averagePlayerCount: 0.8,
      startTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
  },
];

function formatDuration(startTime) {
  const startMs = Date.parse(startTime);
  if (Number.isNaN(startMs)) return "unknown";

  const totalMinutes = Math.max(0, Math.floor((Date.now() - startMs) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

module.exports = {
  name: "active-worlds",
  description: "Live feed of currently-splashing members, posted to the active worlds channel",
  formatDuration,
  buildComponent(sessions = SAMPLE_SESSIONS) {
    const accentColor = sessions.length == 0 ? 0xe31717 : 0x0abf0d
    const container = new ContainerBuilder().setAccentColor(accentColor);
    const count = sessions.length === 1 ? "1 active splasher" : `${sessions.length} active splashers`;

    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(`# Active Worlds\n-# \`${count}\` updated <t:${Math.floor(Date.now() / 1000)}:R>`)
    );
    container.addSeparatorComponents((separator) => separator);

    if (sessions.length === 0) {
      container.addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("No one is currently splashing.")
      );
      return container;
    }

    for (const { username, session } of sessions) {
      const flag = getWorldFlag(session.world);
      const spellIcon = getSpellIcon(session.spell)
      
      container.addTextDisplayComponents(
        (textDisplay) => textDisplay.setContent(
          `${flag} W${session.world} ➔ *${username}*\n` +
          `Spell: ${spellIcon} • Players: ${session.averagePlayerCount.toFixed(1)} avg • ` +
          `Duration: ${formatDuration(session.startTime)}`
        ),
      );
    }

    return container;
  },
};
