"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.npMessage = void 0;
const tslib_1 = require("tslib");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const discord_js_1 = tslib_1.__importDefault(require("discord.js"));
const utils_1 = require("./utils");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
async function npMessage(args) {
    const { client, npSong, guildIdParam, interaction, message } = args;
    let i;
    if (!message && interaction && !guildIdParam) {
        i = interaction;
    }
    else if (message) {
        i = message;
    }
    const guildId = (guildIdParam ? guildIdParam : i?.guildId);
    let settings;
    if (client) {
        settings = client.db.get(guildId);
    }
    else if (i) {
        settings = i.client.db.get(guildId);
    }
    if (!settings)
        return { error: 'nosettings' };
    const MUSIC_CHANNEL_ID = settings.musicChannel;
    const playingMessageId = settings.playingMessage;
    let musicChannel;
    if (i === undefined && client) {
        let cacheGuild = client.guilds.cache.get(guildId);
        musicChannel = await cacheGuild?.channels.fetch(MUSIC_CHANNEL_ID);
        if (!musicChannel) {
            return { error: 'noMusicChannel1' };
        }
    }
    else if (i) {
        musicChannel = i.client.channels.cache.get(MUSIC_CHANNEL_ID);
    }
    if (!musicChannel) {
        if (!i) {
            console.error('music channel not found');
            return { error: 'noMusicChannel2' };
        }
        if ('isButton' in i) {
            i.reply({
                content: 'There has been an error with the Now Playing message\nPlease consult an administrator to re-run setup.',
            });
        }
        return { error: 'noMusicChannel3' };
    }
    let queue;
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
    const messages = await musicChannel.messages.fetch({ limit: 10 });
    const npmessage = messages.get(playingMessageId);
    npmessage?.edit({ content: outputQueue, embeds: [newEmbed] });
    const collector = npmessage?.createMessageComponentCollector({ componentType: 'BUTTON' });
    const output = { npmessage, collector };
    return output;
}
exports.npMessage = npMessage;
//# sourceMappingURL=npmessage.js.map