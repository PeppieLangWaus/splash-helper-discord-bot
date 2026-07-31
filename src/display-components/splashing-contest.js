const { ButtonBuilder, ButtonStyle, ContainerBuilder, SeparatorSpacingSize } = require("discord.js");

const rules = `
**1.** All submissions must have at least⁽ ᵃ ⁾ -64 magic attack bonus.
**2.** Submission must be able to auto-cast standard spells.  
**3.** Irons are able to participate, but are only able to get a prize if they are 1st or 2nd place.  
**4.** Multiple submissions are allowed, but spamming will result in being disqualified.
**5.** Only one prize can be won per contestant.
-# a. ^ Technically should be 'at most'. Yes, you are very smart.`;

const rating = `
 - **Ease of Obtaining**
  This one speaks for itself. Think cost, quest requirements, tradable, etc.
 - **Ease of use**
  Does the fit use a smoke battlestaff? what spell should be cast? Will I need to be stocking up on other runes?
 - **Fashion**
  Do it look good?
-# Extra points if going the extra mile. Like matching it to my mains fit, giving it a backstory, or any other way that shows you put in some real effort.`;

const prizePool = 
`
> |᲼Placement  |󠀲᲼᲼᲼᲼Prize᲼᲼᲼᲼ |
> |:------------:|:---------------:|
> |᲼᲼᲼᲼1st᲼᲼᲼᲼|᲼᲼᲼3 x <:bond:1523006774234452089>᲼᲼᲼ ­|
> |᲼᲼᲼ 2nd᲼᲼᲼ |᲼᲼᲼1 x  <:bond:1523006774234452089>᲼᲼᲼  |
> |᲼᲼᲼ 3rd᲼᲼᲼᲼|᲼᲼᲼5M <:gp:1523007359310364854>᲼᲼᲼ |
> |᲼᲼4th-8th᲼᲼|᲼᲼᲼1M  <:gp:1523007359310364854>᲼᲼᲼ |
`;

const spacing = [
    "|­|",
    "| |",
    "| |",
    "| |",
    "| |",
    "| |",
    "| |",
    "| |",
    "| |",
    "|⠀|",
    "|ㅤ|",
    "|-|-|",
];




module.exports = {
    name: "splashing-contest",
    description: "Peppie's Splashing contest",
    buildComponent() {
        return new ContainerBuilder()
            .setAccentColor(0x57f287)
            .addSectionComponents((section) =>
                section.addTextDisplayComponents(
                    (textDisplay) => textDisplay.setContent(
                        "# <a:osrsdance:1523007353207783526><@292904869390450690>'s splasher 𝒻𝒶𝓈𝒽𝒾ℴ𝓃 contest<a:osrsdance:1523007353207783526>"
                        + "\n-#  \"Max level\" you say? I'm just getting started!"
                    ),
                    (textDisplay) => textDisplay.setContent(
                        "In celebration of my splasher hitting **99 magic**, I am hosting a fashionscape contest."
                    )
                ).setThumbnailAccessory((thumbnail) =>
                    thumbnail.setURL("https://oldschool.runescape.wiki/images/Coins_detail.png?404bc")
                )
            ).addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    "Having splashed to a Magic cape all the way from level 63 using *fire strike* of all spells, I think I deserve to get myself something nice."
                    + "\nWouldn't you agree?"
                ),
                (textDisplay) => textDisplay.setContent(
                    "This, however, isn't just a regular, run-of-the-mill contest. This one comes with a rule."
                )
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    "## The rule||s||"
                    + "\nOkay. You got me. I lied, there's a few rules."
                    + "\nIn my defense though, the first rule is what this contest's all about."
                ),
                (textDisplay) => textDisplay.setContent(rules)
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    "## Submission rating"
                    + "\nI'm rating the submission by a few criteria, some having more weight than others."
                    + "\nTake these as guidelines, not as a formula, eye of the beholder and whatnot."
                ),
                (textDisplay) => textDisplay.setContent(rating)
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    "## Prize Pool"
                    + "\nThe only thing that matters. **Cold**, *hard* __cash__."
                ),
                (textDisplay) => textDisplay.setContent(prizePool),
                (textDisplay) => textDisplay.setContent(
                    "\n-# With the hugest of thanks to all the people donating, without them I'd not be able to offer these prizes."
                )
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent(
                    "## Useful stuff"
                    + "\n**1.** [scape.fashion](https://scape.fashion) - The best tool for planning out a new fit."
                    + "\n**2.** [Wise Old Man](https://wiseoldman.net/players/PeppieSplash) - Check out my ~~very impressive~~ stats."
                    + "\n**3.** [WikiSync Tracker](https://oldschool.runescape.wiki/w/RuneScape:WikiSync/Tracker) - To see if I love questing lookup: **PeppieSplash**."
                    + "\n**4.** [Main's RuneProfile](https://www.runeprofile.com/p%20e%20p%20p%20i%20e) - Check to see my main's fashionscape."  
                    + "\n**5.** [OSRS Best In Slot](https://www.osrsbestinslot.com/gear-picker/) - You can use this to share your fit."
                    + "\n**6.** [Fashionscape Plugin](https://runelite.net/plugin-hub/show/fashionscape) - Great plugin for fashionscaping."
                )
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents(
                (textDisplay) => textDisplay.setContent("## How do I submit a fit?"),
                (textDisplay) => textDisplay.setContent(
                    "### To submit a fit, you have three options:"
                    + "\n**1.** Use the [OSRS Best In Slot](https://www.osrsbestinslot.com/gear-picker/) to create a loadout and share its link"
                    + "\n**2.** Take a screenshot of your equipment stats tab and list the items worn."
                    + "\n**3.** Use the fashionscape plugin to create a loadout and add the .txt file to your submission."                   
                    + "\n### To each submission, please include the following information:"
                    + "\n - Your RSN to the top of the submission."
                    + "\n - If applicable, add backstory to your fit, or any other info I should know about, to the submission."
                ),
                (textDisplay) => textDisplay.setContent(
                        "The button below will take you to my DMs, where you can submit your entry. If you have any questions, feel free to ask me there as well.\n"
                        + "\n-# The contest will run till **Sunday, August 2nd**"
                )
            )
            .addSeparatorComponents((separator) => separator.setDivider(false))
            .addActionRowComponents((actionRow) =>
                actionRow.setComponents(
                    new ButtonBuilder()
                        .setLabel("Submit an entry")
                        .setStyle(ButtonStyle.Link)
                        .setURL("https://discordapp.com/users/292904869390450690")
                )
            )
            .addSeparatorComponents((separator) => 
                separator.setSpacing(SeparatorSpacingSize.Small)
                .setDivider(false)
            )
            .addSeparatorComponents((separator) => separator.setSpacing(SeparatorSpacingSize.Small));
    },
};