/* global __base */
const path = require('path');
const i18n = require('i18n');
const discordjs = require('discord.js');
const WOKCommands = require('wokcommands');

global.__base = path.join(__dirname, '/');
const { Intents } = discordjs;
const { MSGTIMEOUT } = require(`${__base}/include/utils`);
const { npMessage } = require(`${__base}/include/npmessage`);
const { findById } = require(`${__base}/include/findById`);
require('dotenv').config();

const client = new discordjs.Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
	// owner: '337710838469230592',
});

client.login(process.env.DISCORD_TOKEN_DEV);
client.queue = new Map();
client.db = new discordjs.Collection();
// client.commands = new Discord.Collection();
// client.on('debug', console.log);
client.on('warn', (info) => console.log(info));
client.on('error', console.error);

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
async function messageStartup(musicGuilds, wok) {
	for (let i = 0; i <= musicGuilds.length - 1; i++) {
		const npMessageObj = [];
		const collectors = [];
		[npMessageObj[i], collectors[i]] = await npMessage({
			client,
			guildIdParam: musicGuilds[i],
			prefix: wok._prefixes[musicGuilds[i]],
		});
		if (!collectors[i] || !npMessageObj[i]) continue;

		collectors[i].on('collect', (i) => {
			const queue = i.client.queue.get(i.guildId);
			if (!queue) {
				i.reply({ content: i18n.__('nowplaying.errorNotQueue'), ephemeral: true });
			}
		});
	}
}

let wok = {};
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.username} (${client.user.id})`);
	client.user.setActivity('with your mum');

	wok = new WOKCommands(client, {
		commandsDir: path.join(__dirname, 'commands'),
		testServers: ['756990417630789744', '856658520270307339'],
		botOwners: '337710838469230592',
		mongoUri: process.env.MONGO_URI,
		delErrMsgCooldown: 5,
		ephemeral: true,
	});

	wok.on('databaseConnected', async () => {
		console.log('MongoDB Connected');

		const musicGuilds = [];
		await client.guilds.fetch().then((cache) => {
			cache.each(async (guild) => {
				// const dbEntry = (await findById(guild.id))._doc;
				findById(guild.id).then(async (dbEntry) => {
					// console.log(dbEntry);
					const { _doc } = dbEntry;
					delete _doc._id;
					delete _doc.__v;
					await client.db.set(guild.id, _doc);
					client.db.each((guildDb) => {
						if (guildDb.musicChannel) {
							musicGuilds.push(guild.id);
						}
					});
				});
			});
		});
		setTimeout(() => messageStartup(musicGuilds, wok), 3_000);
		// console.log(client.db);
		// console.log(musicGuilds);
	});

	wok.setCategorySettings([
		{ name: 'fun', emoji: ':video_game:' },
		{ name: 'moderation', emoji: ':cop:' },
		{ name: 'music', emoji: ':musical_note:' },
		{ name: 'testing', emoji: ':construction:' },
	]);
	// TODO Set queue.playing false on statup to ensure queue works correctly

	// // Creates inhibitor to restrict music commands to music channel
	// client.dispatcher.addInhibitor((msg) => {
	// 	const musicChannel = msg.guild.settings.get('musicChannel');
	// 	const prefix = msg.guild.commandPrefix;
	// 	// If no musicChannel, recommend run setup
	// 	if (msg.command.groupID === 'music' && !musicChannel) {
	// 		msg.delete({ timeout: MSGTIMEOUT });
	// 		return {
	// 			reason: 'nosetup',
	// 			response: msg.reply(i18n.__mf('common.noSetup', { prefix }))
	// 				.then((response) => {
	// 					response.delete({ timeout: MSGTIMEOUT });
	// 				}).catch(console.error),
	// 		};
	// 	}
	// 	if (msg.command.groupID === 'music' && (musicChannel !== msg.channel.id)) {
	// 		msg.delete({ timeout: MSGTIMEOUT });
	// 		return {
	// 			reason: 'wrongchannel',
	// 			response: msg.reply(i18n.__mf('common.channelOnly', { channel: msg.guild.settings.get('musicChannel') }))
	// 				.then((response) => {
	// 					response.delete({ timeout: MSGTIMEOUT + 800 });
	// 				})
	// 				.catch(console.error),
	// 		};
	// 	}
	// });
});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	const { guildId } = message;
	const prefix = wok._prefixes[guildId];
	if (message.content.startsWith(prefix)) {
		message.isCommand = true;
	} else {
		message.isCommand = false;
	}
	let MUSIC_CHANNEL_ID = (await findById(guildId)).musicChannel;
	if (!MUSIC_CHANNEL_ID) {
		MUSIC_CHANNEL_ID = '';
	}

	if (!message.content.startsWith(prefix) && message.channelId === MUSIC_CHANNEL_ID) {
		const args = message.content.trim().split(/ +/);
		try {
			wok.commandHandler._commands.get('play').callback({
				message,
				args,
				instance: wok,
				prefix,
			});
			return;
		} catch (error) {
			console.error(error);
			message
				.reply(i18n.__('common.errorCommand'))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				})
				.catch(console.error);
		}
	}

	// const { commandHandler } = wok;
	// const command = message.content.split(' ')[0].substring(1);
	// const commands = [''];

	// await commandHandler.commands.forEach((cmdObj) => {
	// 	commands.push(cmdObj.names[0]);
	// });

	// if (!commands.includes(command)) {
	// 	message.channel
	// 		.send(i18n.__mf('common.unknownCommand', { prefix }))
	// 		.then((msg) => {
	// 			setTimeout(() => msg.delete(), MSGTIMEOUT);
	// 		})
	// 		.catch(console.error);
	// }
});
