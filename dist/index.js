"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
const wokcommands_1 = tslib_1.__importDefault(require("wokcommands"));
global.__base = path_1.default.join(__dirname, '/');
const { Intents } = discord_js_1.default;
require('dotenv').config();
const client = new discord_js_1.default.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});
i18n_1.default.configure({
    locales: ['en', 'es', 'ko', 'fr', 'tr', 'pt_br', 'zh_cn', 'zh_tw'],
    directory: path_1.default.join(__dirname, '..', 'locales'),
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
}
else {
    client.login(process.env.DISCORD_TOKEN);
}
client.queue = new Map();
client.db = new discord_js_1.default.Collection();
client.on('warn', (info) => console.log(info));
client.on('error', console.error);
let wok;
client.on('ready', async (client) => {
    console.log(`Logged in as ${client.user.username} (${client.user.id})`);
    wok = new wokcommands_1.default(client, {
        commandsDir: path_1.default.join(__dirname, 'commands'),
        featuresDir: path_1.default.join(__dirname, 'features'),
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
client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;
    const { guildId } = message;
    const settings = client.db.get(guildId);
    if (!settings)
        return;
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
        }
        catch (error) {
            console.error(error);
            message
                .reply(i18n_1.default.__('common.errorCommand'))
                .then((msg) => {
                msg.delete();
            })
                .catch(console.error);
        }
    }
});
//# sourceMappingURL=index.js.map