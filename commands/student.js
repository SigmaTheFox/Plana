const {
	Client,
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');
const { readFileSync } = require('fs');

const emotes = require('../json/emotes.json');

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
		const backButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Secondary)
			.setLabel('Back')
			.setEmoji('⬅️')
			.setCustomId('back');
		const forwardButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Secondary)
			.setLabel('Forwards')
			.setEmoji('➡️')
			.setCustomId('forward');

		const userInput = interaction.options.getString('name');
		const student = students.find(
			student => student.Name.toLowerCase() === userInput.toLowerCase()
		);

		const embed = new EmbedBuilder()
			.setThumbnail(
				`https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/icon/${student.Id}.webp`
			)
			.setTitle(student.Name);

		const msg = await interaction.reply({
			embeds: [embed.setFields(embedPages(student)[0]).setFooter({ text: 'Page 1' })],
			components: [new ActionRowBuilder().addComponents([forwardButton])],
		});

		let filter = ({ user }) => user.id === interaction.user.id;
		let collector = msg.createMessageComponentCollector({
			filter,
			time: 60000,
		});

		let pageIndex = 0;
		collector.on('collect', async interaction => {
			interaction.customId === 'back' ? (pageIndex -= 1) : (pageIndex += 1);
			await interaction.update({
				embeds: [
					embed
						.setFields(embedPages(student)[pageIndex])
						.setFooter({ text: `Page ${pageIndex + 1}` }),
				],
				components: [
					new ActionRowBuilder().addComponents([
						...(pageIndex ? [backButton] : []),
						...(pageIndex + 1 < 3 ? [forwardButton] : []),
					]),
				],
			});
		});
		collector.on('end', () => {
			msg.edit({ components: [] }).catch(() => {});
		});
	},
};

function embedPages(student) {
	const pages = {
		0: [
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
			{
				name: 'Equipment',
				value: student.Equipment.join(', '),
			},
		],
		1: [
			{
				name: 'page',
				value: '1',
			},
		],
		2: [
			{
				name: 'page',
				value: '2',
			},
		],
	};

	return pages;
}
