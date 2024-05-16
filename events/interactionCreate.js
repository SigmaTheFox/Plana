const { Client, Interaction } = require('discord.js');

/**
 *
 * @param {Client} bot
 * @param {Interaction} interaction
 */
module.exports = async (bot, interaction) => {
	// handle context menu commands
	if (interaction.isContextMenuCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(ayanami, interaction);
		} catch (err) {
			ayanami.logger.error(err);
			console.error(err);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: 'There was an error while executing this command!',
					ephemeral: true,
				});
			}
		}
	}

	// handle slash commands
	else if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(bot, interaction);
		} catch (err) {
			console.error(err);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					ephemeral: true,
				});
			}
		}
	}

	if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) return;
		try {
			await command.autocomplete(bot, interaction);
		} catch (err) {
			console.error(err);
		}
	}
};
