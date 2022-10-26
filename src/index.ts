import path from 'path';
import i18n from 'i18n';
import discordjs from 'discord.js';
import WOKCommands from 'wokcommands';
import 'dotenv/config';

global.__base = path.join(__dirname, '/');
const { Intents } = discordjs;

const client = new discordjs.Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

// i18n locale config
i18n.configure({
	locales: ['en', 'es', 'ko', 'fr', 'tr', 'pt_br', 'zh_cn', 'zh_tw'],
	directory: path.join(__dirname, '..', 'locales'),
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

if (process.argv[2] === 'dev') {
	client.login(process.env.DISCORD_TOKEN_DEV);
} else {
	client.login(process.env.DISCORD_TOKEN);
}
client.queue = new Map();
client.db = new discordjs.Collection();
// client.on('debug', console.log);
client.on('warn', (info) => console.log(info));
client.on('error', console.error);

let wok: WOKCommands;
client.on('ready', async (client) => {
	console.log(`I am Logged in as ${client.user.username} (${client.user.id})`);

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
		{ name: 'fun', emoji: '🎮' },
		{ name: 'moderation', emoji: '👮' },
		{ name: 'music', emoji: '🎵' },
		{ name: 'testing', emoji: '🚧' },
	]);
});

client.on('messageCreate', async (message: discordjs.Message) => {
	if (message.author.bot) return;
	const { guildId } = message;

	const settings = client.db.get(guildId!);
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
					msg.delete();
				})
				.catch(console.error);
		}
	}
});
