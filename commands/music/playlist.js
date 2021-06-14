const { MessageEmbed } = require("discord.js");
const { play } = require("../../include/play");
const ytdl = require("ytdl-core-discord");
const YouTubeAPI = require("simple-youtube-api");
const scdl = require("soundcloud-downloader").default;
var { MUSIC_CHANNEL_ID, playingMessageId } = require("../../config");
const { npMessage } = require("../../include/npmessage");
var XMLHttpRequest = require('xhr2');

const {
    YOUTUBE_API_KEY,
    SOUNDCLOUD_CLIENT_ID,
    MAX_PLAYLIST_SIZE,
    DEFAULT_VOLUME,
    LOCALE
} = require("../../util/utils");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const i18n = require("i18n");

i18n.setLocale(LOCALE);

module.exports = {
    name: "playlist",
    cooldown: 5,
    aliases: ["pl"],
    description: i18n.__("playlist.description"),
    isMusic: true,
    async execute(message, args) {
        const { channel } = message.member.voice;
        const serverQueue = message.client.queue.get(message.guild.id);

        const musicChannel = message.guild.channels.cache.get(MUSIC_CHANNEL_ID);
        if (!args.length)
            return message
                .reply(i18n.__mf("playlist.usageReply", { prefix: message.client.prefix }))
                .catch(console.error);
        if (!channel) return message.reply(i18n.__("playlist.errorNotChannel")).catch(console.error);

        const permissions = channel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return message.reply(i18n.__("playlist.missingPermissionConnect"));
        if (!permissions.has("SPEAK")) return message.reply(i18n.__("missingPermissionSpeak"));

        if (serverQueue && channel !== message.guild.me.voice.channel)
            return message
                .reply(i18n.__mf("play.errorNotInSameChannel", { user: message.client.user }))
                .catch(console.error);

        const search = args.join(" ");
        const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
        const url = args[0];
        const urlValid = pattern.test(args[0]);

        const queueConstruct = {
            textChannel: message.channel,
            channel,
            connection: null,
            songs: [],
            loop: false,
            volume: DEFAULT_VOLUME || 100,
            playing: true
        };

        let playlist = null;
        let videos = [];

        if (urlValid) {
            try {
                playlist = await youtube.getPlaylist(url, { part: "snippet" });
                videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: "snippet" });
            } catch (error) {
                console.error(error);
                return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).catch(console.error);
            }
        } else if (scdl.isValidUrl(args[0])) {
            if (args[0].includes("/sets/")) {
                message.channel.send(i18n.__("playlist.fetchingPlaylist"));
                playlist = await scdl.getSetInfo(args[0], SOUNDCLOUD_CLIENT_ID);
                videos = playlist.tracks.map((track) => ({
                    title: track.title,
                    url: track.permalink_url,
                    duration: track.duration / 1000
                }));
            }
        } else {
            try {
                const results = await youtube.searchPlaylists(search, 1, { part: "snippet" });
                playlist = results[0];
                videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: "snippet" });
            } catch (error) {
                console.error(error);
                return message.reply(error.message).catch(console.error);
            }
        }

        async function checkImage(url1) {
            var req = new XMLHttpRequest();
            req.open('HEAD', url1, true);
            await req.send();
            return req.status == 200;

        }
        const newSongs =  videos
            .filter( (video) => video.title != "Private video" && video.title != "Deleted video")
            .map( (video) => {
                songId =  ytdl.getURLVideoID(video.url)
                if (checkImage(`https://i3.ytimg.com/vi/${songId}/maxresdefault.jpg`)) {
                    var songThumb = `https://i3.ytimg.com/vi/${songId}/maxresdefault.jpg`
                }
                else if (checkImage(`https://i3.ytimg.com/vi/${songId}/hqdefault.jpg`)) {
                    var songThumb = `https://i3.ytimg.com/vi/${songId}/hqdefault.jpg`
                }
                else {
                    var songThumb = 'https://i.imgur.com/TObp4E6.jpg'
                    console.log("No thumb")
                };
                return (song = {
                    title: video.title,
                    url: video.url,
                    thumbUrl: songThumb,
                    duration: video.durationSeconds
                });
            });
        //console.log(newSongs);
        serverQueue ?  serverQueue.songs.push(...newSongs) :  queueConstruct.songs.push(...newSongs);

        //outputArray returns playingMessage in item 1 and reaction colllector in item 2
        //var outputArray = await npMessage(message, song);
        
        //var [playingMessage, collector] = outputArray
        //console.log(playingMessage);
        /*let playlistEmbed = new MessageEmbed()
            .setTitle(`${playlist.title}`)
            .setDescription(newSongs.map((song, index) => `${index + 1}. ${song.title}`))
            .setURL(playlist.url)
            //.setColor("#F8AA2A")
            //.setTimestamp();

        playingMessage.edit(playlistEmbed);
        if (playlistEmbed.description.length >= 2048)
            playlistEmbed.description =
                playlistEmbed.description.substr(0, 2007) + i18n.__("playlist.playlistCharLimit");
                */
        //message.channel.send(i18n.__mf("playlist.startedPlaylist", { author: message.author }), playlistEmbed);

        if (!serverQueue) {
            message.client.queue.set(message.guild.id, queueConstruct);

            try {
                queueConstruct.connection = await channel.join();
                await queueConstruct.connection.voice.setSelfDeaf(true);
                play(queueConstruct.songs[0], message, newSongs);
                //console.log(queueConstruct.songs[0]);
            } catch (error) {
                console.error(error);
                message.client.queue.delete(message.guild.id);
                await channel.leave();
                return message.channel.send(i18n.__("play.cantJoinChannel", { error: error })).catch(console.error);
            }
        }
    }
};
