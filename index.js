require('module-alias/register');
const Discord = require('discord.js');
const i18n = require('i18n');
const path = require('path');
const Commando = require('discord.js-commando');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
require('dotenv').config();
const { MSGTIMEOUT } = require('@util/utils');
const { npMessage } = require('@include/npmessage');
const { openDb } = require('@include/opendb');

// const { openDb } = require('./include/opendb');

// const client = new Discord.Client();
const client = new Commando.Client({
	owner: '337710838469230592',
	commandPrefix: '&',
});
client.login();
client.queue = new Map();
client.commands = new Discord.Collection();
// client.on('debug', console.log)
client.on('warn', (info) => console.log(info));
client.on('error', console.error);

/* openDb('./data/serverData.sqlite').then(db => {
	return db;
});
*/

// sql.open('/data/serverData.sqlite');
// i18n locale config
i18n.configure({
	locales: ['en', 'es', 'ko', 'fr', 'tr', 'pt_br', 'zh_cn', 'zh_tw'],
	directory: path.join(__dirname, 'locales'),
	defaultLocale: 'en',
	objectNotation: true,
	register: global,

	logWarnFn: function warn(msg) {
		console.log('warn', msg);
	},

	logErrorFn: function err(msg) {
		console.log('error', msg);
	},

	missingKeyFn: function noKey(locale, value) {
		return value;
	},

	mustacheConfig: {
		tags: ['{{', '}}'],
		disable: false,
	},
});

// Commando create commands

// Create array of command names from commands directory
/*
var fileSync = function (dir, filelist) {

	if (dir[dir.length - 1] != '/') dir = dir.concat('/')

	var fs = fs || require('fs'),
		files = fs.readdirSync(dir);
	filelist = filelist || [];
	files.forEach(function (file) {
		if (fs.statSync(dir + file).isDirectory()) {
			filelist = fileSync(dir + file + '/', filelist);
		}
		else {
			filelist.push(dir + file);
		}
	});
	return filelist;
};

const commandFiles = fileSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${file}`);
	//  set a new item in the Collection
	//  with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
} */
// Create cooldown collection
const cooldowns = new Discord.Collection();

// doing this here fails as there is no message to pass it

// console.log(client.guilds.cac);
let db = {};
client.once('ready', async () => {
	console.log(`Logged in as ${client.user.username} (${client.user.id})`);
	client.user.setActivity('Crimes', { type: 'STREAMING' });

	client.registry
		.registerGroups([
			['fun', 'Fun Commands'],
			['moderation', 'Moderation Command Group'],
			['music', 'Music Command Group'],
			['misc', 'Miscelanious Commands'],
		])
		.registerDefaults()
		.registerCommandsIn(path.join(__dirname, 'commands'));

	client.setProvider(sqlite.open({ filename: './data/commandoData.db', driver: sqlite3.Database }).then((thedb) => new Commando.SQLiteProvider(thedb)))
		.catch(console.error);
	// Open serverData database and assign database object to db
	db = await openDb();

	/* db = await sql.open({
		filename: './data/serverData.sqlite',
		driver: sqlite3.cached.Database,
	}).then((thedb) => thedb);
	*/
	// If servers table doesnt exist then create it. Then get all results from table
	const serverDb = await db.run('CREATE TABLE IF NOT EXISTS servers (guildId varchar(18) NOT NULL PRIMARY KEY, channelId varchar(18), playingMessageId varchar(18));')
		.then(async () => {
			const result2 = await db.all(' SELECT * FROM servers;');
			// console.log(rows)
			return result2;
		}).catch(console.error);
	// console.log(serverDb);

	// console.log(serverDb.length)
	for (let i = 0; i <= (serverDb.length - 1); i++) {
		const npMessageObj = [];
		const collector = [];
		[npMessageObj[i], collector[i]] = await npMessage(undefined, undefined, client, serverDb[i].guildId);
		collector[i].on('collect', (reaction, user) => {
			const queue = reaction.message.client.queue.get(reaction.message.guild.id);// .songs
			if (!queue) {
				reaction.users.remove(user).catch(console.error);
				reaction.message.channel.send(i18n.__mf('nowplaying.errorNotQueue'))
					.then((msg) => {
						msg.delete({ timeout: MSGTIMEOUT });
					}).catch(console.error);
			}
		});
	}
});

client.on('message', async (message) => {
	// console.log(message);
	// If message doesn't start with prefix or is written by a bot, ignore
	if (message.author.bot) return;

	// vvv What is this for?? vvv
	// if (message.channel.id === '756990417630789746') return;
	let MUSIC_CHANNEL_ID = await db.get(`SELECT * FROM servers WHERE guildId='${message.guild.id}'`).then((row) => {
		// console.log(row.channelId);
		if (row) {
			return row.channelId;
		}
		return '';
	}).catch(console.error);

	if (!MUSIC_CHANNEL_ID) {
		MUSIC_CHANNEL_ID = '';
	}
	const prefix = message.guild.commandPrefix;
	// console.log(MUSIC_CHANNEL_ID);
	if (!message.content.startsWith(prefix)) {
		if (message.channel.id !== MUSIC_CHANNEL_ID) {
			return;
		}
		if (message.channel.id === MUSIC_CHANNEL_ID) {
			const args = message.content.trim().split(/ +/);

			try {
				client.registry.resolveCommand('play').run(message, args);
				console.log('done');
				return;
			} catch (error) {
				console.error(error);
				message.reply('There was an error trying to execute that command, please try again.').then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				})
					.catch(console.error);
			}
		}
	}

	/* if (!message.content.startsWith(prefix) || message.author.bot) {
		if (message.author.id !== client.user.id) {
			if (message.channel.id === MUSIC_CHANNEL_ID) {
				message.delete();
			};
			return;
		};
	}; */
	// console.log('Message content:' + message.content);
	/* if (message.author.id === client.user.id) {
	 }; */

	// splice off arguments from command and place into an array by spaces
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	// remove first element from array, set to commandName
	const commandName = args.shift().toLowerCase();
	// if command or alias doesnt exist then function exits
	const command = client.commands.get(commandName)
		|| client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) {
		// TODO localise//
		message.reply(`That isn't a command! \n Use ${prefix}help to see a list of my commands`).then((msg) => {
			msg.delete({ timeout: MSGTIMEOUT });
		})
			.catch(console.error);
		return;
	}
	// /Guild Only?// /
	if (command.guildOnly && message.channel.type === 'dm') {
		// TODO localise//
		message.reply('I can\'t execute that command inside DMs!').then((msg) => {
			msg.delete({ timeout: MSGTIMEOUT });
		})
			.catch(console.error);
		return;
	}
	// Is the command music channel only?//

	if (command.isMusic && (message.channel.id !== MUSIC_CHANNEL_ID)) {
		if (!MUSIC_CHANNEL_ID) {
			message.channel.send(`You need to run ${prefix}setup before you can use this command`);
			return;
		}

		const musicChannelName = message.guild.channels.cache.get(MUSIC_CHANNEL_ID).id;
		message.reply(i18n.__mf('common.musicOnly', { channel: musicChannelName })).then((msg) => {
			msg.delete({ timeout: MSGTIMEOUT });
		}).catch(console.error);
		return;
	}
	// /Usr has perms?// /
	if (command.permissions) {
		const authorPerms = message.channel.permissionsFor(message.author);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			message.reply(i18n.__mf('common.musicOnly')).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			})
				.catch(console.error);
			return;
		}
	}
	// /Does cmd require args, if yes then check they are provided// /
	if (command.args && !args.length) {
		let reply = 'You didn\'t provide any arguments';

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}
		message.channel.send(reply).then((msg) => {
			msg.delete({ timeout: (MSGTIMEOUT + 5000) });
		}).catch(console.error);
		return;
	}
	// // // // // /Setup Cooldown check for commands that require it// // // // // // // // // /
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
			return;
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	/*
		// /Execute command// /
		try {
			command.execute(message, args);
			return;
		}
		// /Catch any unexpected errors, print to console and notify usr // /ADD LOG FILE// /
		catch (error) {
			console.error(error);
			message.reply('There was an error trying to execute that command, please try again.').then(msg => {
				msg.delete({ timeout: MSGTIMEOUT })
			})
				.catch(console.error);
		} */
});
