"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.npMessage = void 0;
const tslib_1 = require("tslib");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
const utils_1 = require("./utils");
const findById_1 = require("./findById");
console.log(utils_1.LOCALE);
i18n_1.default.setLocale('en');
async function npMessage(args) {
    const { client, npSong, guildIdParam, interaction, message } = args;
    let i;
    if (!message && interaction && !guildIdParam) {
        i = interaction;
    }
    else if (message) {
        i = message;
    }
    ;
    const guildId = (guildIdParam ? guildIdParam : i?.guildId);
    const settings = await (0, findById_1.findById)(guildId);
    const MUSIC_CHANNEL_ID = settings.musicChannel;
    const playingMessageId = settings.playingMessage;
    let musicChannel;
    if (i === undefined && client) {
        musicChannel = await client.guilds.cache.get(guildId)?.channels.cache.get(MUSIC_CHANNEL_ID);
        if (!musicChannel) {
            return {};
        }
    }
    else if (i) {
        musicChannel = await i.client.channels.cache.get(MUSIC_CHANNEL_ID);
    }
    if (!musicChannel) {
        if (!i)
            return {};
        i.reply({ content: 'There has been an error with the Now Playing message\nPlease consult an administrator to re-run setup.' });
        return {};
    }
    let queue = [];
    if (i && npSong && guildId !== null) {
        queue = i.client.queue.get(guildId)?.songs;
    }
    var outputQueue = i18n_1.default.__('npmessage.emptyQueue');
    var songsQueue = '';
    if (queue) {
        const displayQueue = queue.slice(1, 11);
        let index = 0;
        for (let i = 0; i < displayQueue.length; i++) {
            index = i + 1;
            songsQueue = `**${index}.** ${displayQueue[i].title}\n ${songsQueue}`;
            if (i === displayQueue.length - 1 && queue.length - 1 > displayQueue.length) {
                const overflow = queue.length - 1 - displayQueue.length;
                if (overflow === 1 && i < displayQueue.length) {
                    songsQueue = `**${index + 1}.** ${queue[i + 2].title}\n ${songsQueue}`;
                    break;
                }
                else if (overflow > 1) {
                    songsQueue = i18n_1.default.__mf('npmessage.overflow', { overflow, songsQueue });
                    break;
                }
            }
        }
        outputQueue = i18n_1.default.__mf('npmessage.outputQueue', { songsQueue });
    }
    let newEmbed = {};
    if (npSong === undefined) {
        newEmbed = new discord_js_1.default.MessageEmbed()
            .setColor('#5865F2')
            .setTitle(i18n_1.default.__('npmessage.title'))
            .setURL('')
            .setImage('https://i.imgur.com/TObp4E6.jpg')
            .setFooter({ text: i18n_1.default.__('npmessage.footer') });
    }
    else {
        newEmbed = new discord_js_1.default.MessageEmbed()
            .setColor('#5865F2')
            .setTitle(i18n_1.default.__mf('npmessage.titleSong', { title: npSong.title }))
            .setURL(npSong.url)
            .setImage(npSong.thumbUrl)
            .setFooter({ text: i18n_1.default.__('npmessage.footer') });
    }
    const output = await musicChannel.messages
        .fetch({ limit: 10 })
        .then(async (messages) => {
        const npmessage = messages.get(playingMessageId);
        npmessage?.edit({ content: outputQueue, embeds: [newEmbed] });
        return npmessage;
    })
        .then(async (npmessage) => {
        const collector = npmessage?.createMessageComponentCollector({ componentType: 'BUTTON' });
        const output = { npmessage, collector };
        return output;
    })
        .catch(console.error);
    return output;
}
exports.npMessage = npMessage;
//# sourceMappingURL=npmessage.js.map