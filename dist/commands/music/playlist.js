"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const play_1 = require("../../include/play");
const npmessage_1 = require("../../include/npmessage");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const voice = tslib_1.__importStar(require("@discordjs/voice"));
const play_dl_1 = tslib_1.__importDefault(require("play-dl"));
const simple_youtube_api_1 = tslib_1.__importDefault(require("simple-youtube-api"));
const he_1 = tslib_1.__importDefault(require("he"));
const { MAX_PLAYLIST_SIZE, LOCALE } = require(`${__base}/include/utils`);
const responses_1 = require("../../include/responses");
const utils_1 = require("../../include/utils");
if (LOCALE)
    i18n_1.default.setLocale(LOCALE);
const youtube = new simple_youtube_api_1.default(process.env.YOUTUBE_API_KEY);
exports.default = {
    name: 'playlist',
    category: 'music',
    description: i18n_1.default.__('playlist.description'),
    guildOnly: true,
    testOnly: utils_1.TESTING,
    slash: true,
    options: [
        {
            name: 'music',
            description: i18n_1.default.__('play.option'),
            type: 'STRING',
            required: true,
        },
    ],
    async callback({ message, interaction, args, }) {
        var i;
        if (interaction) {
            i = interaction;
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: true });
            }
        }
        else if (message) {
            i = message;
        }
        else {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
            return;
        }
        if (!i.guild) {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
            return;
        }
        const settings = i.client.db.get(i.guild.id);
        const MUSIC_CHANNEL_ID = settings?.musicChannel;
        if (settings === undefined || !MUSIC_CHANNEL_ID) {
            (0, responses_1.reply)({ message, interaction, content: i18n_1.default.__('common.noSetup'), ephemeral: true });
            message?.delete();
            return;
        }
        const musicChannel = await i.guild.channels.fetch(MUSIC_CHANNEL_ID);
        const member = i.member;
        if (member.voice) {
            var { channel } = member.voice;
        }
        else {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('play.errorNotChannel'), ephemeral: true });
            return;
        }
        const serverQueue = i.client.queue.get(i.guild.id);
        if (!channel) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('playlist.errorNotChannel'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (i.guild.me) {
            var permissions = channel.permissionsFor(i.guild.me);
        }
        else {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
            return;
        }
        if (!permissions.has('CONNECT')) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('playlist.missingPermissionConnect'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (!permissions.has('SPEAK')) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('missingPermissionSpeak'),
                ephemeral: true,
            });
            message?.delete();
            return;
        }
        if (serverQueue && channel !== i.guild.me.voice.channel) {
            (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__mf('play.errorNotInSameChannel', {
                    user: i.client.user.id,
                }),
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
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('play.missingSpot'), ephemeral: true });
        }
        if (play_dl_1.default.is_expired()) {
            await play_dl_1.default.refreshToken();
        }
        const url = args[0];
        const isSpotify = play_dl_1.default.sp_validate(url);
        const isYt = play_dl_1.default.yt_validate(url);
        var searching;
        if (message) {
            searching = await message.reply(i18n_1.default.__('playlist.searching'));
        }
        else if (interaction) {
            searching = (await interaction.editReply({
                content: i18n_1.default.__('playlist.searching'),
            }));
        }
        else {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
            return;
        }
        var videos = [];
        var playlistTitle;
        if (isYt === 'playlist') {
            try {
                let playlist = await play_dl_1.default.playlist_info(url, { incomplete: true });
                if (!playlist.title)
                    return;
                playlistTitle = playlist.title;
                await playlist.fetch(MAX_PLAYLIST_SIZE);
                const vidInfo = playlist.page(1);
                vidInfo.slice(0, MAX_PLAYLIST_SIZE + 1).forEach((video) => {
                    if (!video.title)
                        return;
                    let song = {
                        title: he_1.default.decode(video.title),
                        url: video.url,
                        thumbUrl: video.thumbnails[video.thumbnails.length - 1].url,
                        duration: video.durationInSec,
                    };
                    videos.push(song);
                });
                if (message) {
                    searching.delete().catch(console.error);
                }
            }
            catch (error) {
                console.error(error);
                if (message) {
                    searching.delete().catch(console.error);
                }
                return (0, responses_1.reply)({
                    message,
                    interaction,
                    content: i18n_1.default.__('playlist.errorNotFoundPlaylist'),
                    ephemeral: true,
                });
            }
        }
        else if (isSpotify === 'playlist' || isSpotify === 'album') {
            try {
                let playlist = await play_dl_1.default.spotify(url);
                if ('fetch' in playlist) {
                    await playlist.fetch();
                }
                playlistTitle = playlist.name;
                if ('page' in playlist) {
                    var tracks = playlist.page(1);
                }
                else {
                    (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
                    return;
                }
                if (tracks.length > MAX_PLAYLIST_SIZE) {
                    (0, responses_1.reply)({
                        message,
                        interaction,
                        content: i18n_1.default.__mf('playlist.maxSize', { maxSize: MAX_PLAYLIST_SIZE }),
                        ephemeral: true,
                    });
                }
                for (let i = 0; i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 20) && i < tracks.length; i++) {
                    let search = tracks[i].name + ' ' + tracks[i].artists[0].name;
                    const results = await youtube.searchVideos(search, 1, {
                        part: 'snippet.title, snippet.maxRes, snippet.durationSeconds',
                    });
                    const searchResult = results[0];
                    if (!searchResult)
                        continue;
                    let song = {
                        title: he_1.default.decode(searchResult?.title),
                        url: searchResult?.url,
                        thumbUrl: searchResult?.maxRes.url,
                        duration: searchResult?.durationInSec,
                    };
                    videos.push(song);
                }
                if (message) {
                    searching.delete().catch(console.error);
                }
            }
            catch (error) {
                console.error(error);
                if (message) {
                    searching.delete().catch(console.error);
                }
                return (0, responses_1.reply)({ message, interaction, content: error.message, ephemeral: true });
            }
        }
        else {
            if (message) {
                searching.delete().catch(console.error);
            }
            (0, responses_1.reply)({ message, interaction, content: i18n_1.default.__('playlist.notPlaylist'), ephemeral: true });
            return;
        }
        async function songAdded(message, interaction, serverQueue) {
            (0, npmessage_1.npMessage)({
                interaction,
                message,
                npSong: serverQueue.songs[0],
            });
            await (0, responses_1.reply)({
                message,
                interaction,
                content: i18n_1.default.__('playlist.success'),
                ephemeral: true,
            });
            serverQueue.textChannel
                .send(i18n_1.default.__mf('playlist.queueAdded', {
                playlist: playlistTitle,
                author: member.id,
            }))
                .then((msg) => {
                setTimeout(() => msg.delete(), utils_1.MSGTIMEOUT);
            })
                .catch(console.error);
        }
        if (serverQueue) {
            if (serverQueue.songs.length === 0) {
                serverQueue.songs.push(...videos);
                (0, play_1.play)({
                    song: serverQueue.songs[0],
                    message,
                    interaction,
                });
                await songAdded(message, interaction, serverQueue);
                message?.delete();
                return;
            }
            else {
                serverQueue.songs.push(...videos);
                await songAdded(message, interaction, serverQueue);
            }
        }
        try {
            if (!voice.getVoiceConnection(i.guild.id)) {
                var newConnection = voice.joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guildId,
                    selfDeaf: true,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
            }
            else {
                throw Error;
            }
            const queueConstruct = {
                textChannel: musicChannel,
                collector: null,
                voiceChannel: channel,
                connection: newConnection,
                player: null,
                timeout: null,
                songs: [...videos],
                loop: false,
                playing: true,
            };
            i.client.queue.set(i.guild.id, queueConstruct);
            (0, responses_1.followUp)({
                message,
                interaction,
                content: i18n_1.default.__mf('playlist.queueAdded', {
                    playlist: playlistTitle,
                    author: member.id,
                }),
                ephemeral: false,
            });
            (0, play_1.play)({ song: queueConstruct.songs[0], message, interaction });
            message?.delete();
        }
        catch (error) {
            console.error(error);
            i.client.queue.delete(i.guild.id);
            let pcon = voice.getVoiceConnection(i.guildId);
            pcon?.destroy();
            return (0, responses_1.followUp)({
                message,
                interaction,
                content: i18n_1.default.__mf('play.cantJoinChannel', { error }),
                ephemeral: true,
            });
        }
    },
};
//# sourceMappingURL=playlist.js.map