const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientID, privateGuildID, token } = require('./settings/config.json');
const { readdirSync } = require('fs');

const commands = [];
const commandFiles = readdirSync('./commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST().setToken(token);

rest.put(Routes.applicationGuildCommands(clientID, privateGuildID), {
	body: commands,
})
	.then(() => console.log('Successfully registered guild commands'))
	.catch(console.error);
