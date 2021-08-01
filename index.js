require('module-alias/register');
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
	commandPrefix: '!',
});
client.login();
client.queue = new Map();
// client.commands = new Discord.Collection();
// client.on('debug', console.log)
client.on('warn', (info) => console.log(info));
client.on('error', console.error);

// i18n locale config
i18n.configure({
	locales: ['en', 'es', 'ko', 'fr', 'tr', 'pt_br', 'zh_cn', 'zh_tw'],
	directory: path.join(__dirname, 'locales'),
	defaultLocale: 'en',







	Notation: true,
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

var db = {};
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
	var provider = null;
	client.setProvider(sqlite.open({ filename: './data/commandoData.db', driver: sqlite3.Database })
		.then((thedb) => { return provider = new Commando.SQLiteProvider(thedb) }))
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

	/*
	// For this to work check if messagechannel is a music channel
	client.dispatcher.addInhibitor((msg) => {
		if (msg.command.groupdID === 'music' && !musicChannels.has(msg.channel.id)) {
			return {
				reason: 'wrongchannel', response: msg.reply('This is inhibitor test'),
			};
		}
	});
	*/
	// console.log(serverDb.length)

	// console.log(getMapSize(provider.settings));
	const settings1 = client.provider.settings;
	const arraySet = settings1.entries();
	// console.log(arraySet);
	console.log(settings1.constructor);
	for (let i = 0; i < settings1.size; i++) {
		const miniMap = arraySet.next().value;
		// console.log(miniMap.get(miniMap.values().next().value));
	}
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
		// client.guilds.cache.get(serverDb[i].guildId).settings.set('test', 'setting');
		let guildy = serverDb[i].guildId;
		//console.log(client.settings.get(global, 'test'));
	}
});

client.on('message', async (message) => {
	// If message doesn't start with prefix or is written by a bot, ignore
	if (message.author.bot) return;
	// console.log(message);
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
	/* if (message.isCommand && (message.command.groupID === 'music') && (message.channel.id !== MUSIC_CHANNEL_ID)) {
		return message.channel.send(i18n.__mf('common.channelOnly', { channel: MUSIC_CHANNEL_ID }))
			.then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			})
			.catch(console.error);
	}
	*/
	if (!message.isCommand) {
		if (message.channel.id === MUSIC_CHANNEL_ID) {
			const args = message.content.trim().split(/ +/);
			try {
				client.registry.resolveCommand('play').run(message, args);
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
});
