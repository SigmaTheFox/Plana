const {
	Client,
	Collection,
	GatewayIntentBits,
	ActivityType: { Custom },
} = require('discord.js');
const { readdirSync } = require('fs');
const { token } = require('./settings/config.json');

const bot = new Client({
	intents: [GatewayIntentBits.Guilds],
	presence: {
		activities: [
			{
				type: Custom,
				name: "It's plana time.",
			},
		],
	},
});

bot.commands = new Collection();

const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
for (file of commandFiles) {
	let command = require(`./commands/${file}`);
	bot.commands.set(command.data.name, command);
}

const eventFiles = readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	let event = require(`./events/${file}`);
	let eventName = file.split('.')[0];

	if (eventName !== 'ready') bot.on(eventName, event.bind(null, bot));
	else bot.once(eventName, event.bind(null, bot));
	delete require.cache[require.resolve(`./events/${file}`)];
}

bot.login(token);
