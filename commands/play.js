const { prefix } = require('../config.json');
const scdl = require("soundcloud-downloader").default;
const { play } = require("../include/play");
module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'play music command',
    args: false,
    usage: '',
    guildOnly: true,
    async execute(message, args) {
            const { channel } = message.member.voice;
            
            const serverQueue = message.client.queue.get(message.guild.id);
            if (!channel) return message.reply(`You are not in a voice channel`).catch(console.error);
            if (serverQueue && channel !== message.guild.me.voice.channel)
                return message
                    .reply(`You must be in the same channel as {user}`, { user: message.client.user })
                    .catch(console.error);

            if (!args.length)
                return message
                    .reply(`Usage: ${ prefix }play  <YouTube URL | Video Name | Soundcloud URL>`)
                    .catch(console.error);

            const permissions = channel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT")) return message.reply(`I don't have permission to join that channel`);
            if (!permissions.has("SPEAK")) return message.reply(`I cannot speak in this voice channel, make sure I have the correct permissions`);

            const search = args.join(" ");
            const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
            const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
            const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
            const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;
            const url = args[0];
            const urlValid = videoPattern.test(args[0]);

            // Start the playlist if playlist url was provided
            if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
                return message.client.commands.get("playlist").execute(message, args);
            } else if (scdl.isValidUrl(url) && url.includes("/sets/")) {
                return message.client.commands.get("playlist").execute(message, args);
            }

            if (mobileScRegex.test(url)) {
                try {
                    https.get(url, function (res) {
                        if (res.statusCode == "302") {
                            return message.client.commands.get("play").execute(message, [res.headers.location]);
                        } else {
                            return message.reply("No content could be found at that url.").catch(console.error);
                        }
                    });
                } catch (error) {
                    console.error(error);
                    return message.reply(error.message).catch(console.error);
                }
                return message.reply("Following url redirection...").catch(console.error);
            }

            const queueConstruct = {
                textChannel: message.channel,
                channel,
                connection: null,
                songs: [],
                loop: false,
                volume: DEFAULT_VOLUME || 100,
                playing: true
            };

            let songInfo = null;
            let song = null;

            if (urlValid) {
                try {
                    songInfo = await ytdl.getInfo(url);
                    song = {
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url,
                        duration: songInfo.videoDetails.lengthSeconds
                    };
                } catch (error) {
                    console.error(error);
                    return message.reply(error.message).catch(console.error);
                }
            } else if (scRegex.test(url)) {
                try {
                    const trackInfo = await scdl.getInfo(url, SOUNDCLOUD_CLIENT_ID);
                    song = {
                        title: trackInfo.title,
                        url: trackInfo.permalink_url,
                        duration: Math.ceil(trackInfo.duration / 1000)
                    };
                } catch (error) {
                    console.error(error);
                    return message.reply(error.message).catch(console.error);
                }
            } else {
                try {
                    const results = await youtube.searchVideos(search, 1, { part: "snippet" });
                    songInfo = await ytdl.getInfo(results[0].url);
                    song = {
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url,
                        duration: songInfo.videoDetails.lengthSeconds
                    };
                } catch (error) {
                    console.error(error);
                    return message.reply(error.message).catch(console.error);
                }
            }

            if (serverQueue) {
                serverQueue.songs.push(song);
                return serverQueue.textChannel
                    .send(`✅ **{title}** has been added to the queue by <@{author}>`, { title: song.title, author: message.author })
                    .catch(console.error);
            }

            queueConstruct.songs.push(song);
            message.client.queue.set(message.guild.id, queueConstruct);

            try {
                queueConstruct.connection = await channel.join();
                await queueConstruct.connection.voice.setSelfDeaf(true);
                play(queueConstruct.songs[0], message);
            } catch (error) {
                console.error(error);
                message.client.queue.delete(message.guild.id);
                await channel.leave();
                return message.channel.send(`Could not join the channel: {error}`, { error: error }).catch(console.error);
            }
        },
};