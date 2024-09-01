const {
	Client,
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
	AutocompleteInteraction,
	ActionRowBuilder,
	PermissionFlagsBits: { UseExternalEmojis },
} = require('discord.js');

const {
	backButton,
	forwardButton,
	exLevelMenu,
	skillLevelMenu,
	gearToggle,
} = require('../modules/actionRows');

let { localization, students, validStudentNames } = require('../modules/getData');

const emotesList = require('../json/emotes.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('student')
		.setDescription('Get info about a Schale student')
		.addStringOption(opt =>
			opt
				.setName('name')
				.setDescription('The name of the student')
				.setAutocomplete(true)
				.setRequired(true)
		)
		.addIntegerOption(opt =>
			opt
				.setName('level')
				.setDescription('The level of stats for the student')
				.setMinValue(0)
				.setMaxValue(100)
				.setRequired(false)
		),
	/**
	 *
	 * @param {Client} bot
	 * @param {AutocompleteInteraction} interaction
	 */
	async autocomplete(bot, interaction) {
		const focused = interaction.options.getFocused().toLowerCase();
		const filtered = validStudentNames()
			.filter(choice => choice.toLowerCase().startsWith(focused))
			.slice(0, 24);
		await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
	},
	/**
	 *
	 * @param {Client} bot
	 * @param {CommandInteraction} interaction
	 */
	async execute(bot, interaction) {
		// Switch emote style if the command is being used in a server without the Use External Emojis permission
		let emotes;
		if (interaction.inCachedGuild() && interaction.appPermissions.has(UseExternalEmojis))
			emotes = emotesList.serverInstall;
		else emotes = emotesList.userInstall;

		// Get the student the user input in the command
		const userInputStudent = interaction.options.getString('name', true);
		const student = Object.values(students()).find(
			student => student.Name.toLowerCase() === userInputStudent.toLowerCase()
		);

		// Get the student level if the user set one, otherwide default to level 1
		student.Level = interaction.options.getInteger('level') || 1;

		const embed = new EmbedBuilder()
			.setThumbnail(
				`https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/icon/${student.Id}.webp`
			)
			.setAuthor({
				name: student.Name,
				iconURL: `https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/icon/${student.Id}.webp`,
			});

		// Send the first page and assign the forward button alongside the 3 dropdown menus
		const msg = await interaction.reply({
			embeds: [
				embed
					.setTitle(embedPages(student, emotes)[0]['title'])
					.setFields(embedPages(student, emotes)[0]['fields'])
					.setFooter({ text: 'Page 1' })
					.setDescription(student.ProfileIntroduction),
			],
			components: [
				new ActionRowBuilder().addComponents([forwardButton]),
				new ActionRowBuilder().addComponents(exLevelMenu.setDisabled(true)),
				new ActionRowBuilder().addComponents(skillLevelMenu.setDisabled(true)),
				new ActionRowBuilder().addComponents(gearToggle.setDisabled(true)),
			],
		});

		// Initialize component collector
		let filter = ({ user }) => user.id === interaction.user.id;
		let collector = msg.createMessageComponentCollector({
			filter,
			time: 120000,
		});

		let pageIndex = 0;
		let skills = {
			exLevel: 0,
			skillLevel: 0,
		};
		let gear = {
			normal: false,
			passive: false,
		};
		collector.on('collect', async interaction => {
			// collect select menu interactions
			if (interaction.isAnySelectMenu()) {
				if (interaction.customId === 'exlevel')
					skills.exLevel = Number(interaction.values[0]);
				if (interaction.customId === 'skilllevel')
					skills.skillLevel = Number(interaction.values[0]);
				if (interaction.customId === 'geartoggle') {
					Object.keys(student['Skills']).find(skill => skill === 'GearPublic')
						? (gear.normal = !!Number(interaction.values[0]))
						: (gear.normal = false);
					gear.passive = !!Number(interaction.values[0]);
				}
			}

			// collect button interactions and change page accordingly
			if (interaction.isButton()) {
				if (interaction.customId === 'back') {
					pageIndex -= 1;
					skills.skillLevel = 0;
					skills.exLevel = 0;
					gear.normal = false;
					gear.passive = false;
				} else {
					pageIndex += 1;
					skills.skillLevel = 0;
					skills.exLevel = 0;
					gear.normal = false;
					gear.passive = false;
				}
			}

			// update the replied embed with the new page
			await interaction.update({
				embeds: [
					embed
						.setTitle(embedPages(student, emotes, gear)[pageIndex]['title'])
						.setFields(embedPages(student, emotes, skills, gear)[pageIndex]['fields'])
						.setFooter({ text: `Page ${pageIndex + 1}` })
						.setDescription(pageIndex === 0 ? student.ProfileIntroduction : '\u200b'),
				],
				components: [
					new ActionRowBuilder().addComponents([
						...(pageIndex ? [backButton] : []),
						...(pageIndex + 1 < Object.keys(embedPages(student, emotes)).length
							? [forwardButton]
							: []),
					]),
					new ActionRowBuilder().addComponents([
						pageIndex === 3
							? exLevelMenu.setDisabled(false)
							: exLevelMenu.setDisabled(true),
					]),
					new ActionRowBuilder().addComponents([
						pageIndex > 3 && pageIndex < Object.keys(embedPages(student, emotes)).length
							? skillLevelMenu.setDisabled(false)
							: skillLevelMenu.setDisabled(true),
					]),
					new ActionRowBuilder().addComponents([
						pageIndex === 4 &&
						Object.keys(student['Skills']).find(skill => skill === 'GearPublic')
							? gearToggle.setDisabled(false)
							: pageIndex === 5
							? gearToggle.setDisabled(false)
							: gearToggle.setDisabled(true),
					]),
				],
			});
		});
		collector.on('end', () => {
			msg.edit({ components: [] }).catch(() => {});
		});
	},
};

// pre-define the embed pages
function embedPages(student, emotes, skills = {}, gear = { normal: false, passive: false }) {
	const pages = {
		0: {
			title: 'Profile',
			fields: [
				{
					name: 'Full Name',
					value: `${student.FamilyName} ${student.PersonalName}`,
					inline: true,
				},
				{ name: 'Rarity', value: '⭐'.repeat(student.StarGrade), inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
				{ name: 'School', value: localization()['School'][student.School], inline: true },
				{ name: 'School Year', value: student.SchoolYear, inline: true },
				{ name: 'Club', value: localization()['Club'][student.Club], inline: true },
				{ name: 'Birthday', value: student.Birthday, inline: true },
				{ name: 'Age', value: student.CharacterAge, inline: true },
				{
					name: 'Height',
					value: `${student.CharHeightMetric} (${student.CharHeightImperial})`,
					inline: true,
				},
				{ name: 'CV', value: student.CharacterVoice, inline: true },
				{ name: 'Desiger', value: student.Designer, inline: true },
				{ name: 'Illustrator', value: student.Illustrator, inline: true },
				{ name: 'Hobbies', value: student.Hobby },
			],
		},
		1: {
			title: 'Attributes',
			fields: [
				{
					name: 'Squad Type',
					value: localization()['SquadType'][student.SquadType],
					inline: true,
				},
				{
					name: 'Role',
					value: localization()['TacticRole'][student.TacticRole],
					inline: true,
				},
				{ name: 'Position', value: student.Position, inline: true },
				{
					name: 'Attack Type',
					value: localization()['BulletType'][student.BulletType],
					inline: true,
				},
				{
					name: 'Armor Type',
					value: localization()['ArmorType'][student.ArmorType],
					inline: true,
				},
				{ name: '\u200b', value: '\u200b', inline: true },
				{
					name: 'Urban',
					value: emotes['affinity' + student.StreetBattleAdaptation],
					inline: true,
				},
				{
					name: 'Outdoor',
					value: emotes['affinity' + student.OutdoorBattleAdaptation],
					inline: true,
				},
				{
					name: 'Indoor',
					value: emotes['affinity' + student.IndoorBattleAdaptation],
					inline: true,
				},
				{
					name: 'Equipment 1',
					value: emotes[student.Equipment[0]],
					inline: true,
				},
				{
					name: 'Equipment 2',
					value: emotes[student.Equipment[1]],
					inline: true,
				},
				{
					name: 'Equipment 3',
					value: emotes[student.Equipment[2]],
					inline: true,
				},
			],
		},
		2: {
			title: `Stats (Level ${student.Level})`,
			fields: [
				{
					name: 'Max HP',
					value: calculateStat(
						'HP',
						student.MaxHP1,
						student.MaxHP100,
						student.Level,
						student.StarGrade,
						student.Weapon.StatLevelUpType
					),
					inline: true,
				},
				{
					name: 'DEF',
					value: calculateStat(
						'DEF',
						student.DefensePower1,
						student.DefensePower100,
						student.Level
					),
					inline: true,
				},
				{
					name: 'Accuracy',
					value: student.AccuracyPoint.toString(),
					inline: true,
				},
				{
					name: 'ATK',
					value: calculateStat(
						'ATK',
						student.AttackPower1,
						student.AttackPower100,
						student.Level,
						student.StarGrade,
						student.Weapon.StatLevelUpType
					),
					inline: true,
				},
				{
					name: 'Healing',
					value: calculateStat(
						'Heal',
						student.HealPower1,
						student.HealPower100,
						student.Level,
						student.StarGrade,
						student.Weapon.StatLevelUpType
					),
					inline: true,
				},
				{
					name: 'Evasion',
					value: student.DodgePoint.toString(),
					inline: true,
				},
				{
					name: 'Crit',
					value: student.CriticalPoint.toString(),
					inline: true,
				},
				{
					name: 'Crit DMG',
					value: `${student.CriticalDamageRate / 100}%`,
					inline: true,
				},
				{
					name: 'Stability',
					value: student.StabilityPoint.toString(),
					inline: true,
				},
				{
					name: 'Crit RES',
					value: '100',
					inline: true,
				},
				{
					name: 'Crit DMG RES',
					value: '50%',
					inline: true,
				},
				{
					name: 'Normal Attack Range',
					value: student.Range.toString(),
					inline: true,
				},
				{
					name: 'CC Power',
					value: '100',
					inline: true,
				},
				{
					name: 'Recovery Boost',
					value: '100%',
					inline: true,
				},
				{
					name: 'Defense Piercing',
					value: '0',
					inline: true,
				},
				{
					name: 'CC RES',
					value: '100',
					inline: true,
				},
				{
					name: 'Cost Recovery',
					value: student.RegenCost.toString(),
					inline: true,
				},
				{
					name: 'Mag Count',
					value: `${student.AmmoCount} (${student.AmmoCost})`,
					inline: true,
				},
			],
		},
		3: getSkills(student['Skills'], 'Ex', skills.exLevel),
		4: getSkills(student['Skills'], gear.normal ? 'GearPublic' : 'Public', skills.skillLevel),
		5: getSkills(
			student['Skills'],
			gear.passive ? 'WeaponPassive' : 'Passive',
			skills.skillLevel
		),
		6: getSkills(student['Skills'], 'ExtraPassive', skills.skillLevel),
	};

	return pages;
}

// calculate the student stats based on the level and stars
function calculateStat(stat, stat1, stat100, level, stars = 1, statGrowthType = 'Standard') {
	let levelScale;
	switch (statGrowthType) {
		case 'LateBloom':
		case 'Premature':
			levelScale = (level - 1) / 99;
			break;
		case 'Standard':
		default:
			levelScale = ((level - 1) / 99).toFixed(4);
			break;
	}

	if (stat === 'DEF')
		return Math.ceil(Math.round(stat1 + (stat100 - stat1) * levelScale)).toString();

	let transcendenceList = {
		ATK: [0, 1000, 1200, 1400, 1700],
		HP: [0, 500, 700, 900, 1400],
		Heal: [0, 750, 1000, 1200, 1500],
	};

	let transcendence = 1;

	for (let i = 0; i < stars; i++) {
		transcendence += transcendenceList[stat][i] / 10000;
	}

	return Math.ceil(
		(Math.round((stat1 + (stat100 - stat1) * levelScale).toFixed(4)) * transcendence).toFixed(4)
	).toString();
}

// create the skill page
function getSkills(skills, type, level) {
	let skill = skills[type],
		skillPage = {
			title: localization()['SkillType'][type],
			fields: [],
		};

	let description = replaceSkillParameterText(skill, level);
	description = replaceSkillStatText(description);
	description = colorAttackType(description);

	skillPage.fields.push({
		name: `${skill['Name']} Lvl ${level + 1}`,
		value: '```ansi\n' + description + '```',
	});

	// Handle skills that can transform
	if (skill.ExtraSkills) {
		let extraSkill = skill.ExtraSkills[0];

		let extraSkillDescription = replaceSkillParameterText(extraSkill, level);
		description = replaceSkillStatText(description);
		description = colorAttackType(description);

		skillPage.fields.push({
			name: `${extraSkill['Name']} Lvl ${level + 1}`,
			value: '```ansi\n' + extraSkillDescription + '```',
		});
	}

	return skillPage;
}

function replaceSkillParameterText(skill, level) {
	let description = skill['Desc'];

	// replace placeholders with the appropriate parameter
	description = description.replace(/<\?1>/g, `[2;31m${skill['Parameters']?.[0]?.[level]}[0m`);
	if (/<\?2>/.test(description))
		description = description.replace(/<\?2>/g, `[2;31m${skill['Parameters']?.[1]?.[level]}[0m`);
	if (/<\?3>/.test(description))
		description = description.replace(/<\?3>/g, `[2;31m${skill['Parameters']?.[2]?.[level]}[0m`);
	if (/<\?4>/.test(description))
		description = description.replace(/<\?4>/g, `[2;31m${skill['Parameters']?.[3]?.[level]}[0m`);
	if (/<\?5>/.test(description))
		description = description.replace(/<\?5>/g, `[2;31m${skill['Parameters']?.[4]?.[level]}[0m`);

	// assign value 40 to the placeholder for knockback
	if (/<kb:1>/.test(description)) description = description.replace(/<kb:1>/g, '40');

	if (/<b>.*<\/b>/i.test(description))
		description = description.replace(/<b>/g, '[1;2m').replace(/<\/b>/g, '[0m');

	return description;
}

function replaceSkillStatText(description) {
	let desc = description;
	let letterAssign = {
		b: 'Buff',
		d: 'Debuff',
		c: 'CC',
		s: 'Special',
	};
	let matches = [...description.matchAll(/<(?<statType>b|d|c|s):(?<statName>\w*)>/g)];

	// replace bugg/debuff/cc/special placeholder text with appropriate names
	for (let match of matches) {
		desc = desc.replaceAll(
			match[0],
			localization()['BuffName'][
				`${letterAssign[match.groups.statType]}_${match.groups.statName}`
			]
		);
	}

	return desc;
}

// Color the attack/defense types in skill descriptions
function colorAttackType(description) {
	let desc = description;
	let typeColors = {
		'ba-col-mystic': '[1;2m[1;34m',
		'ba-col-pierce': '[1;2m[1;33m',
		'ba-col-explosion': '[1;2m[1;31m',
	};

	const matches = [
		...description.matchAll(
			/<b\sclass=['"](?<typeColor>ba-col-\w*)['"]>(?<typeName>[\w\s]+)<\/b>/g
		),
	];

	for (let match of matches) {
		desc = desc.replaceAll(
			match[0],
			`${typeColors[match.groups.typeColor]}${match.groups.typeName}[0m[0m`
		);
	}

	return desc;
}
