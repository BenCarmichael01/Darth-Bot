"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const play_1 = require("../../include/play");
const simple_youtube_api_1 = tslib_1.__importDefault(require("simple-youtube-api"));
const play_dl_1 = tslib_1.__importDefault(require("play-dl"));
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const voice = tslib_1.__importStar(require("@discordjs/voice"));
const he_1 = tslib_1.__importDefault(require("he"));
const npmessage_1 = require("../../include/npmessage");
const utils_1 = require("../../include/utils");
const responses_1 = require("../../include/responses");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
const youtube = new simple_youtube_api_1.default(utils_1.YOUTUBE_API_KEY);
exports.default = {
    name: 'play',
    category: 'music',
    description: i18n_1.default.__('play.description'),
    guildOnly: true,
    slash: true,
    testOnly: utils_1.TESTING,
    options: [
        {
            name: 'music',
            description: i18n_1.default.__('play.option'),
            type: 'STRING',
            required: true,
        },
    ],
    async callback(options) {
        const { message, interaction, args, prefix, instance } = options;
        let i;
        if (interaction) {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: true });
            }
            i = interaction;
        }
        else if (message) {
            i = message;
        }
        if (!i)
            return;
        const settings = i.client.db.get(i.guildId);
        if (!settings) {
            await (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('common.noSetup'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        const musicChannel = await i.guild.channels.fetch(settings.musicChannel);
        if (!settings?.musicChannel || !musicChannel) {
            await (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('common.noSetup'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        const member = i.member;
        const guild = i.guild;
        const userVc = member.voice.channel;
        const botVoiceChannel = guild.me.voice.channel;
        const serverQueue = i.client.queue.get(guild.id);
        if (!userVc) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('play.errorNotChannel'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (serverQueue && userVc !== botVoiceChannel) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__mf('play.errorNotInSameChannel', {
                    user: i.client.user,
                }),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (!args.length) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__mf('play.usageReply', { prefix }),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        const permissions = userVc.permissionsFor(i.client.user);
        if (!permissions) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('play.permsNotFound'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (!permissions.has('CONNECT')) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('play.missingPermissionConnect'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (!permissions.has('SPEAK')) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('play.missingPermissionSpeak'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (process.env.SPOTIFY_CLIENT &&
            process.env.SPOTIFY_SECRET &&
            process.env.SPOTIFY_REFRESH &&
            process.env.SPOTIFY_MARKET) {
            await play_dl_1.default.setToken({
                spotify: {
                    client_id: process.env.SPOTIFY_CLIENT,
                    client_secret: process.env.SPOTIFY_SECRET,
                    refresh_token: process.env.SPOTIFY_REFRESH,
                    market: process.env.SPOTIFY_MARKET,
                },
            });
        }
        else {
            (0, responses_1.reply)({
                interaction,
                message,
                content: i18n_1.default.__('play.missingSpot'),
                ephemeral: true,
            });
        }
        if (play_dl_1.default.is_expired()) {
            await play_dl_1.default.refreshToken();
        }
        if (serverQueue?.timeout) {
            clearTimeout(serverQueue.timeout);
        }
        const search = args.join(' ');
        const url = args[0];
        const isSpotify = play_dl_1.default.sp_validate(url);
        const isYt = play_dl_1.default.yt_validate(url);
        if (isYt === 'playlist') {
            instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
            return;
        }
        if (isSpotify === 'playlist' || isSpotify === 'album') {
            instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
            return;
        }
        let songInfo = null;
        let song = null;
        if (isYt === 'video' && url.startsWith('https')) {
            try {
                songInfo = await youtube.getVideo(url, { part: 'snippet' });
                song = {
                    title: he_1.default.decode(songInfo.title),
                    url: songInfo.url,
                    thumbUrl: songInfo.maxRes.url,
                    duration: songInfo.durationSeconds,
                };
            }
            catch (error) {
                if (!(error instanceof Error))
                    return;
                console.error(error);
                (0, responses_1.followUp)({
                    message,
                    interaction,
                    content: i18n_1.default.__mf('play.queueError', {
                        error: error.message ? error.message : error,
                    }),
                    ephemeral: false,
                });
                return;
            }
        }
        else if (isSpotify === 'track') {
            try {
                const spot = (await play_dl_1.default.spotify(url));
                if (spot.type === 'track') {
                    let search = spot.name + ' ' + spot.artists[0].name;
                    const results = await youtube.searchVideos(search, 1, {
                        part: 'snippet',
                    });
                    const searchResult = results[0];
                    song = {
                        title: he_1.default.decode(searchResult.title),
                        url: searchResult.url,
                        thumbUrl: searchResult.maxRes.url,
                        duration: searchResult.durationSeconds,
                    };
                }
            }
            catch (error) {
                if (!(error instanceof Error))
                    return;
                console.error(error);
                (0, responses_1.followUp)({
                    message,
                    interaction,
                    content: i18n_1.default.__mf('play.queueError', {
                        error: error.message ? error.message : error,
                    }),
                    ephemeral: false,
                });
                return;
            }
        }
        else {
            try {
                const results = await youtube.searchVideos(search, 1, {
                    part: 'snippet',
                });
                const searchResult = results[0];
                song = {
                    title: he_1.default.decode(searchResult.title),
                    url: searchResult.url,
                    thumbUrl: searchResult.maxRes.url,
                    duration: searchResult.durationSeconds,
                };
            }
            catch (error) {
                if (!(error instanceof Error))
                    return;
                console.error(error);
                (0, responses_1.followUp)({
                    message,
                    interaction,
                    content: i18n_1.default.__mf('play.queueError', {
                        error: error.message ? error.message : error,
                        ephemeral: false,
                    }),
                    ephemeral: false,
                });
                message ? message.delete() : null;
                return;
            }
        }
        if (!song) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('play.songError'),
                ephemeral: true,
            });
            return;
        }
        async function songAdded(message, interaction, serverQueue, song) {
            (0, npmessage_1.npMessage)({
                interaction,
                message,
                npSong: serverQueue.songs[0],
            });
            await (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('play.success'),
                ephemeral: true,
            });
            serverQueue.textChannel
                .send(i18n_1.default.__mf('play.queueAdded', {
                title: song.title,
                author: member.id,
            }))
                .then((msg) => {
                setTimeout(() => msg.delete(), utils_1.MSGTIMEOUT);
            })
                .catch(console.error);
        }
        if (serverQueue) {
            if (serverQueue.songs.length === 0) {
                serverQueue.songs.push(song);
                (0, play_1.play)({
                    song: serverQueue.songs[0],
                    message,
                    interaction,
                });
                await songAdded(message, interaction, serverQueue, song);
                message?.delete();
                return;
            }
            else {
                serverQueue.songs.push(song);
                await songAdded(message, interaction, serverQueue, song);
            }
        }
        try {
            const connection = voice.getVoiceConnection(guild.id);
            if (!connection) {
                var newConnection = voice.joinVoiceChannel({
                    channelId: userVc.id,
                    guildId: userVc.guildId,
                    selfDeaf: true,
                    adapterCreator: userVc.guild.voiceAdapterCreator,
                });
            }
            else {
                newConnection = connection;
            }
            const queueConstruct = {
                textChannel: musicChannel,
                collector: null,
                voiceChannel: userVc,
                connection: newConnection,
                player: null,
                timeout: null,
                songs: [song],
                loop: false,
                playing: true,
            };
            i.client.queue.set(guild.id, queueConstruct);
            (0, play_1.play)({
                song: queueConstruct.songs[0],
                message,
                interaction,
            });
            await (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('play.success'),
                ephemeral: true,
            });
            if (message?.deletable) {
                message.delete();
            }
            queueConstruct.textChannel
                .send({
                content: i18n_1.default.__mf('play.queueAdded', {
                    title: queueConstruct.songs[0].title,
                    author: member.id,
                }),
            })
                .then((msg) => {
                setTimeout(() => {
                    msg.delete().catch(console.error);
                }, utils_1.MSGTIMEOUT);
            })
                .catch(console.error);
        }
        catch (error) {
            if (!(error instanceof Error))
                return;
            console.error(error);
            i.client.queue.delete(guild.id);
            let pcon = voice.getVoiceConnection(guild.id);
            pcon?.destroy();
            (0, responses_1.followUp)({
                message,
                interaction,
                content: i18n_1.default.__('play.cantJoinChannel', {
                    error: error.message,
                }),
                ephemeral: true,
            });
            if (message?.deletable) {
                message.delete();
                return;
            }
        }
        return;
    },
};
//# sourceMappingURL=play.js.map