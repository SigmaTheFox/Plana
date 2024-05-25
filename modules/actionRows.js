const {
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');

const backButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Secondary)
	.setLabel('Back')
	.setEmoji('⬅️')
	.setCustomId('back');
const forwardButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Secondary)
	.setLabel('Next')
	.setEmoji('➡️')
	.setCustomId('forward');

const exLevelMenu = new StringSelectMenuBuilder()
	.setCustomId('exlevel')
	.setPlaceholder('EX Level')
	.setDisabled(true)
	.setMinValues(1)
	.setMaxValues(1)
	.setOptions(
		new StringSelectMenuOptionBuilder().setLabel('EX Level 1').setValue('0'),
		new StringSelectMenuOptionBuilder().setLabel('EX Level 2').setValue('1'),
		new StringSelectMenuOptionBuilder().setLabel('EX Level 3').setValue('2'),
		new StringSelectMenuOptionBuilder().setLabel('EX Level 4').setValue('3'),
		new StringSelectMenuOptionBuilder().setLabel('EX Level 5').setValue('4')
	);
const skillLevelMenu = new StringSelectMenuBuilder()
	.setCustomId('skilllevel')
	.setPlaceholder('Skill Level')
	.setDisabled(true)
	.setMinValues(1)
	.setMaxValues(1)
	.setOptions(
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 1').setValue('0'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 2').setValue('1'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 3').setValue('2'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 4').setValue('3'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 5').setValue('4'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 6').setValue('5'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 7').setValue('6'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 8').setValue('7'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 9').setValue('8'),
		new StringSelectMenuOptionBuilder().setLabel('Skill Level 10').setValue('9')
	);

const gearToggle = new StringSelectMenuBuilder()
	.setCustomId('geartoggle')
	.setPlaceholder('Toggle Gear')
	.setDisabled(true)
	.setMinValues(1)
	.setMaxValues(1)
	.setOptions(
		new StringSelectMenuOptionBuilder().setLabel('Enabled').setValue('1'),
		new StringSelectMenuOptionBuilder().setLabel('Disabled').setValue('0')
	);

module.exports = {
	backButton,
	forwardButton,
	exLevelMenu,
	skillLevelMenu,
	gearToggle,
};
