/* global __base */
const path = require('path');
const i18n = require('i18n');
const discordjs = require('discord.js');
const WOKCommands = require('wokcommands');

global.__base = path.join(__dirname, '/');
const { Intents } = discordjs;
const { MSGTIMEOUT } = require(`${__base}/include/utils`);
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
if (process.argv[2] === 'dev') {
	client.login(process.env.DISCORD_TOKEN_DEV);
} else {
	client.login(process.env.DISCORD_TOKEN);
}
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
	autoReload: true,

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

let wok = {};
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.username} (${client.user.id})`);

	wok = new WOKCommands(client, {
		commandsDir: path.join(__dirname, 'commands'),
		featuresDir: path.join(__dirname, 'features'),
		testServers: ['756990417630789744', '856658520270307339'],
		botOwners: '337710838469230592',
		mongoUri: process.env.MONGO_URI,
		delErrMsgCooldown: 5,
		ephemeral: true,
	});

	wok.setCategorySettings([
		{ name: 'fun', emoji: ':video_game:' },
		{ name: 'moderation', emoji: ':cop:' },
		{ name: 'music', emoji: ':musical_note:' },
		{ name: 'testing', emoji: ':construction:' },
	]);
});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	const { guildId } = message;

	const settings = client.db.get(guildId);
	if (!settings) return;

	let MUSIC_CHANNEL_ID = settings.musicChannel;
	if (!MUSIC_CHANNEL_ID) {
		MUSIC_CHANNEL_ID = '';
	}

	if (message.channelId === MUSIC_CHANNEL_ID) {
		const args = message.content.trim().split(/ +/);
		try {
			wok.commandHandler._commands.get('play').callback({
				message,
				args,
				instance: wok,
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
});
