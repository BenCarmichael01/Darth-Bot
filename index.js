// require('module-alias/register');`${__base}include/npmessage`
const path = require('path');

global.__base = path.join(__dirname, '/');
const i18n = require('i18n');
const Commando = require('discord.js-commando');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
require('dotenv').config();

const { MSGTIMEOUT } = require(`${__base}util/utils`);
const { npMessage } = require(`${__base}include/npmessage`);

const client = new Commando.Client({
	owner: '337710838469230592',
	commandPrefix: '!',
});
client.login(process.env.DISCORD_TOKEN_DEV);
client.queue = new Map();
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

	await client.setProvider(sqlite.open({ filename: './data/commandoData.db', driver: sqlite3.cached.Database })
		.then((thedb) => new Commando.SQLiteProvider(thedb)))
		.catch(console.error);

	// Creates inhibitor to restrict music commands to music channel
	client.dispatcher.addInhibitor((msg) => {
		const musicChannel = msg.guild.settings.get('musicChannel');
		const prefix = msg.guild.commandPrefix;
		// If no musicChannel, recommend run setup
		if (msg.command.groupID === 'music' && !musicChannel) {
			msg.delete({ timeout: MSGTIMEOUT });
			return {
				reason: 'nosetup',
				response: msg.reply(i18n.__mf('common.noSetup', { prefix }))
					.then((response) => {
						response.delete({ timeout: MSGTIMEOUT });
					}).catch(console.error),
			};
		}
		if (msg.command.groupID === 'music' && (musicChannel !== msg.channel.id)) {
			msg.delete({ timeout: MSGTIMEOUT });
			return {
				reason: 'wrongchannel',
				response: msg.reply(i18n.__mf('common.channelOnly', { channel: msg.guild.settings.get('musicChannel') }))
					.then((response) => {
						response.delete({ timeout: MSGTIMEOUT + 800 });
					})
					.catch(console.error),
			};
		}
	});
	const musicGuilds = [];
	client.guilds.cache.each((guild) => {
		const channelExists = guild.settings.get('musicChannel');
		if (channelExists) {
			musicGuilds.push(guild.id);
		}
	});

	for (let i = 0; i <= (musicGuilds.length - 1); i++) {
		const npMessageObj = [];
		const collector = [];
		[npMessageObj[i], collector[i]] = await npMessage({ client, guildIdParam: musicGuilds[i] });
		collector[i].on('collect', (reaction, user) => {
			const queue = reaction.message.client.queue.get(reaction.message.guild.id);
			if (!queue) {
				reaction.users.remove(user).catch(console.error);
				reaction.message.channel.send(i18n.__('nowplaying.errorNotQueue'))
					.then((msg) => {
						msg.delete({ timeout: MSGTIMEOUT });
					}).catch(console.error);
			}
		});
	}
});

client.on('message', async (message) => {
	// console.log(message);
	if (message.author.bot) return;
	let MUSIC_CHANNEL_ID = await message.guild.settings.get('musicChannel');

	if (!MUSIC_CHANNEL_ID) {
		MUSIC_CHANNEL_ID = '';
	}

	if (!message.isCommand && (message.channel.id === MUSIC_CHANNEL_ID)) {
		const args = message.content.trim().split(/ +/);
		try {
			client.registry.resolveCommand('play').run(message, args);
			return;
		} catch (error) {
			console.error(error);
			message.reply(i18n.__('errorCommand')).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			})
				.catch(console.error);
		}
	}
});
