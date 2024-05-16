const {
	Client,
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
	AutocompleteInteraction,
} = require('discord.js');
const { readFileSync } = require('fs');

const localization = require('../json/localization.json');
const emotes = require('../json/emotes.json');

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
		const userInput = interaction.options.getString('name');
		const student = students.find(student => student.Name === userInput);

		const embedPage1 = new EmbedBuilder()
			.setThumbnail(
				`https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/icon/${student.Id}.webp`
			)
			.setTitle(student.Name)
			.addFields([
				{ name: 'Rarity', value: '⭐'.repeat(student.StarGrade), inline: true },
				{ name: 'School', value: localization['School'][student.School], inline: true },
				{ name: 'Club', value: localization['Club'][student.Club], inline: true },
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
			]);

		interaction.reply({ embeds: [embedPage1] });
	},
};
