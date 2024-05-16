const { SlashCommandBuilder, Client, CommandInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
	/**
	 *
	 * @param {Client} bot
	 * @param {CommandInteraction} interaction
	 */
	async execute(bot, interaction) {
		let m = await interaction.reply({
			content: 'pong...',
			ephemeral: true,
			fetchReply: true,
		});
		let ping = m.createdTimestamp - interaction.createdTimestamp;
		interaction.editReply(`Pong! My ping is: ${ping}ms`);
	},
};
