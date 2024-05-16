const {
	SlashCommandBuilder,
	Client,
	AutocompleteInteraction,
	CommandInteraction,
} = require('discord.js');

module.exports = {
	private: true,
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command')
		.addStringOption(opt =>
			opt
				.setName('command')
				.setDescription('Command to reload')
				.setRequired(true)
				.setAutocomplete(true)
		),
	/**
	 *
	 * @param {Client} bot
	 * @param {AutocompleteInteraction} interaction
	 */
	async autocomplete(bot, interaction) {
		const focused = interaction.options.getFocused();
		const filtered = [
			...bot.commands.filter(choice => choice.data.name.startsWith(focused)).keys(),
		].slice(0, 24);
		await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
	},
	/**
	 *
	 * @param {Client} bot
	 * @param {CommandInteraction} interaction
	 */
	async execute(bot, interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply({
				content: `There is no command with the name \`${commandName}\`!`,
				ephemeral: true,
			});
		}

		delete require.cache[require.resolve(`./${command.data.name}.js`)];

		try {
			bot.commands.delete(command.data.name);
			const newCommand = require(`./${command.data.name}`);
			bot.commands.set(newCommand.data.name, newCommand);
			await interaction.reply({
				content: `Comamnd \`${newCommand.data.name}\` was reloaded!`,
			});
		} catch (err) {
			console.error(err);
			await interaction.reply({
				content: `There was an error while reloading a command \`${command.data.name}\`:\n\`${err.message}\``,
				ephemeral: true,
			});
		}
	},
};
