const fs = require('fs');
const Discord = require('discord.js');
//import prefix and bot token from config file
const { prefix, token } = require('./config.json');
const { error } = require('console');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


for (const file of commandFiles) {
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}
const cooldowns = new Discord.Collection();

//import variables from .env folder
//const dotenv = require('dotenv');
//dotenv.config();
// ... client setup (keep reading)
//console.log(process.env.A);
//console.log(process.env.B);
//console.log(process.env.TOKEN)


client.on('message', message => {
	//If message starts with prefix and is written by a bot, ignore
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	//splice off arguments from command and place into an array by spaces
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	//take the first element of the array, set to commandName var, remove from array
	const commandName = args.shift().toLowerCase();
	//if command doesnt exist then go to catch(error)
	if (!client.commands.has(commandName)) return;

	const command = client.commands.get(commandName);
	
	if(command.guildOnly && message.channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}
		return message.channel.send(reply);
	}

	///////////Setup Cooldown check for commands that require it///////////////////
	if (cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	/////////////////////////////////////////////////////////
	try {
		command.execute(message, args);
	}
	catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command, please try again.')
    }
});

client.once('ready', () => {
	console.log('Ready!');
});

//login to Discord with token from config
client.login(token);
