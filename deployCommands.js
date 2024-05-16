const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientID, privateGuildID, token } = require('./settings/config.json');
const { readdirSync } = require('fs');

const commands = [];
const privateCommands = [];
const commandFiles = readdirSync('./commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	if (command.private === true) privateCommands.push(command.data.toJSON());
	else commands.push(command.data.toJSON());
}

const rest = new REST().setToken(token);

rest.put(Routes.applicationGuildCommands(clientID, privateGuildID), {
	body: privateCommands,
})
	.then(() => console.log('Successfully registered private commands'))
	.catch(console.error);

rest.put(Routes.applicationCommands(clientID), {
	body: commands,
})
	.then(() => console.log('Successfully registered commands'))
	.catch(console.error);
