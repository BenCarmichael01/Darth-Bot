"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var i18n_1 = __importDefault(require("i18n"));
var discord_js_1 = __importDefault(require("discord.js"));
var wokcommands_1 = __importDefault(require("wokcommands"));
global.__base = path_1.default.join(__dirname, '/');
var Intents = discord_js_1.default.Intents;
require('dotenv').config();
var client = new discord_js_1.default.Client({
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
}
else {
    client.login(process.env.DISCORD_TOKEN);
}
client.queue = new Map();
client.db = new discord_js_1.default.Collection();
// client.commands = new Discord.Collection();
// client.on('debug', console.log);
client.on('warn', function (info) { return console.log(info); });
client.on('error', console.error);
// i18n locale config
i18n_1.default.configure({
    locales: ['en', 'es', 'ko', 'fr', 'tr', 'pt_br', 'zh_cn', 'zh_tw'],
    directory: path_1.default.join(__dirname, 'locales'),
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
var wok;
client.on('ready', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("Logged in as ".concat(client.user.username, " (").concat(client.user.id, ")"));
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
        return [2 /*return*/];
    });
}); });
client.on('messageCreate', function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var guildId, settings, MUSIC_CHANNEL_ID, args;
    return __generator(this, function (_a) {
        if (message.author.bot)
            return [2 /*return*/];
        guildId = message.guildId;
        settings = client.db.get(guildId);
        if (!settings)
            return [2 /*return*/];
        MUSIC_CHANNEL_ID = settings.musicChannel;
        if (!MUSIC_CHANNEL_ID) {
            MUSIC_CHANNEL_ID = '';
        }
        if (message.channelId === MUSIC_CHANNEL_ID) {
            args = message.content.trim().split(/ +/);
            try {
                wok.commandHandler._commands.get('play').callback({
                    message: message,
                    args: args,
                    instance: wok,
                });
                return [2 /*return*/];
            }
            catch (error) {
                console.error(error);
                message
                    .reply(i18n_1.default.__('common.errorCommand'))
                    .then(function (msg) {
                    msg.delete();
                })
                    .catch(console.error);
            }
        }
        return [2 /*return*/];
    });
}); });
