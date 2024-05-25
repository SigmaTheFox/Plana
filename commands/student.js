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
const { readFileSync } = require('fs');

const emotesList = require('../json/emotes.json');

let localization = JSON.parse(readFileSync('./json/localization.json'));
let students = JSON.parse(readFileSync('./json/students.json'));
let validStudentNames = students.map(student => student.Name);

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
		const filtered = validStudentNames
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
		let emotes;
		if (interaction.inCachedGuild() && interaction.appPermissions.has(UseExternalEmojis))
			emotes = emotesList.serverInstall;
		else emotes = emotesList.userInstall;

		const userInputStudent = interaction.options.getString('name', true);
		const student = students.find(
			student => student.Name.toLowerCase() === userInputStudent.toLowerCase()
		);

		student.Level = interaction.options.getInteger('level') || 1;

		const embed = new EmbedBuilder()
			.setThumbnail(
				`https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/icon/${student.Id}.webp`
			)
			.setAuthor({
				name: student.Name,
				iconURL: `https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/icon/${student.Id}.webp`,
			});

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

		let filter = ({ user }) => user.id === interaction.user.id;
		let collector = msg.createMessageComponentCollector({
			filter,
			time: 60000,
		});

		let pageIndex = 0;
		let skills = {
			exLevel: 0,
			skillLevel: 0,
		};
		let gear = false;
		collector.on('collect', async interaction => {
			if (interaction.isAnySelectMenu()) {
				if (interaction.customId === 'exlevel')
					skills.exLevel = Number(interaction.values[0]);
				if (interaction.customId === 'skilllevel')
					skills.skillLevel = Number(interaction.values[0]);
				if (interaction.customId === 'geartoggle') gear = !!Number(interaction.values[0]);
			}

			if (interaction.isButton()) {
				if (interaction.customId === 'back') {
					pageIndex -= 1;
					skills.skillLevel = 0;
					skills.exLevel = 0;
					gear = false;
				} else {
					pageIndex += 1;
					skills.skillLevel = 0;
					skills.exLevel = 0;
					gear = false;
				}
			}

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
						(pageIndex === 4 || pageIndex === 5) &&
						student['Skills'].find(skill => skill.SkillType === 'gearnormal')
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

function embedPages(student, emotes, skills = {}, gear = false) {
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
				{ name: 'School', value: localization['School'][student.School], inline: true },
				{ name: 'School Year', value: student.SchoolYear, inline: true },
				{ name: 'Club', value: localization['Club'][student.Club], inline: true },
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
					value: localization['SquadType'][student.SquadType],
					inline: true,
				},
				{
					name: 'Role',
					value: localization['TacticRole'][student.TacticRole],
					inline: true,
				},
				{ name: 'Position', value: student.Position, inline: true },
				{
					name: 'Attack Type',
					value: localization['BulletType'][student.BulletType],
					inline: true,
				},
				{
					name: 'Armor Type',
					value: localization['ArmorType'][student.ArmorType],
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
		3: getSkills(student['Skills'], 'ex', skills.exLevel),
		4: getSkills(student['Skills'], gear ? 'gearnormal' : 'normal', skills.skillLevel),
		5: getSkills(student['Skills'], gear ? 'weaponpassive' : 'passive', skills.skillLevel),
		6: getSkills(student['Skills'], 'sub', skills.skillLevel),
	};

	return pages;
}

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

function getSkills(skills, type, level) {
	let words = {
		ex: localization['ui']['student_skill_ex'],
		normal: localization['ui']['student_skill_normal'],
		gearnormal: localization['ui']['student_skill_gearnormal'],
		passive: localization['ui']['student_skill_passive'],
		weaponpassive: localization['ui']['student_skill_weaponpassive'],
		sub: localization['ui']['student_skill_sub'],
	};
	let param1Regex = /<\?1>/g,
		param2Regex = /<\?2>/g;

	let skill = skills.find(skill => skill['SkillType'] === type),
		skillPage = {
			title: words[type],
			fields: [],
		};

	let description = skill['Desc'].replace(param1Regex, `[2;31m${skill['Parameters'][0][level]}[0m`);
	if (testSkillParameters(description, 2))
		description = description.replace(param2Regex, `[2;31m${skill['Parameters'][1][level]}[0m`);

	skillPage.fields.push({
		name: `${skill['Name']} Lvl ${level + 1}`,
		value: '```ansi\n' + description + '```',
	});

	return skillPage;
}

function testSkillParameters(description, parameterNum) {
	return RegExp(`<\\?${parameterNum}>`).test(description);
}
