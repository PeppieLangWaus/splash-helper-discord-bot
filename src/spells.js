const spellIcons = {
    WIND_STRIKE: "<:windStrike:1533591045160435852>",
    WATER_STRIKE: "<:waterStrike:1533591032996823181>",
    EARTH_STRIKE: "<:earthStrike:1533591030958395515>",
    FIRE_STRIKE: "<:fireStrike:1533591032090857582>",
    WIND_BOLT: "<:windBolt:1533591212806901881>",
    WATER_BOLT: "<:waterBolt:1533591211707727882>",
    EARTH_BOLT: "<:earthBolt:1533591209455521942>",
    FIRE_BOLT: "<:FireBolt:1533591210567143634>",
    WIND_BLAST: "<:windBlast:1533591304460701887>",
    WATER_BLAST: "<:waterBlast:1533591303386828870>",
    EARTH_BLAST: "<:earthBlast:1533591300945875066>",
    FIRE_BLAST: "<:fireBlast:1533591302183325808>",
}

function getSpellIcon(spell) {
    return spellIcons[spell];
}

module.exports = { getSpellIcon };