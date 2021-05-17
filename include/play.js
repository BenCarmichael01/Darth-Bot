const ytdl = require("ytdl-core-discord");
const scdl = require("soundcloud-downloader").default;
const { canModifyQueue, STAY_TIME, LOCALE, PRUNING, MSGTIMEOUT } = require("../util/utils");
const i18n = require("i18n");
i18n.setLocale(LOCALE);
const np = require("../commands/music/nowplaying");
var { MUSIC_CHANNEL_ID, playingMessageId } = require("../util/utils");
const { npMessage } = require("./npmessage");

module.exports = {
    async play(song, message) {
        const { SOUNDCLOUD_CLIENT_ID } = require("../util/utils");
        //TODO is this const needed?:
        const musicChannel = message.guild.channels.cache.get(MUSIC_CHANNEL_ID);
        let config;

        try {
            config = require("../config.json");
        } catch (error) {
            config = null;
        }


        const queue = message.client.queue.get(message.guild.id);

        //May need to check that songs exist instead of queue as current song may be removed from queue after it starts
        if (queue) {
            var npSong = queue.songs[0]
            npMessage(message, npSong);
        }
        //console.log("queue:")
        //console.log(message.client.queue.get(message.guild.id));
        if (!song) {
            setTimeout(function () {
                if (queue.connection.dispatcher && message.guild.me.voice.channel)
                    return;
                queue.channel.leave();
                queue.textChannel.send(i18n.__("play.leaveChannel"))
                    .then(msg => {
                        msg.delete({ timeout: MSGTIMEOUT })
                    }).catch(console.error);
            }, STAY_TIME * 1000);
            queue.textChannel.send(i18n.__("play.queueEnded"))
                .then(msg => {
                    msg.delete({ timeout: MSGTIMEOUT })
                })
                .catch(console.error);
            return message.client.queue.delete(message.guild.id);
        }

        let stream = null;
        let streamType = song.url.includes("youtube.com") ? "opus" : "ogg/opus";

        try {
            if (song.url.includes("youtube.com")) {
                stream = await ytdl(song.url, { highWaterMark: 1 << 25 });
            } else if (song.url.includes("soundcloud.com")) {
                try {
                    stream = await scdl.downloadFormat(
                        song.url,
                        scdl.FORMATS.OPUS,
                        SOUNDCLOUD_CLIENT_ID
                    );
                } catch (error) {
                    stream = await scdl.downloadFormat(
                        song.url,
                        scdl.FORMATS.MP3,
                        SOUNDCLOUD_CLIENT_ID
                    );
                    streamType = "unknown";
                }
            }
        } catch (error) {
            if (queue) {
                queue.songs.shift();
                /*
                  channel = MUSIC_CHANNEL_ID
                  channel.messages.fetch({ limit: 1 }).then(messages => {
                      var lastBotMessage = messages.find(element => element.author.bot())
                      console.log(lastBotMessage);
                  })
                      .catch(console.error);
                  */
                module.exports.play(queue.songs[0], message);
            }

            console.error(error);
            return message.channel.send(
                i18n.__mf("play.queueError", {
                    error: error.message ? error.message : error
                })
            );
        }

        queue.connection.on("disconnect", () =>
            message.client.queue.delete(message.guild.id)
        );

        const dispatcher = queue.connection
            .play(stream, { type: streamType })
            .on("finish", () => {
                if (collector && !collector.ended) collector.stop();

                if (queue.loop) {
                    // if loop is on, push the song back at the end of the queue
                    // so it can repeat endlessly
                    let lastSong = queue.songs.shift();
                    queue.songs.push(lastSong);
                    module.exports.play(queue.songs[0], message);
                } else {
                    // Recursively play the next song
                    queue.songs.shift();
                    module.exports.play(queue.songs[0], message);
                }
            })
            .on("error", err => {
                console.error(err);
                queue.songs.shift();
                module.exports.play(queue.songs[0], message);
            });
        dispatcher.setVolumeLogarithmic(queue.volume / 100);
        //TODO 
        /*
        async function npMessage() {
           output1 = await musicChannel.messages.fetch({ limit: 10 })
                .then(async messages => {
                    var outputVar = [];
                    outputVar[0] = await messages.get(playingMessageId);
                    //console.log(outputVar[0]);
                    outputVar[0].edit(i18n.__mf("play.startedPlaying", { title: song.title, url: song.url }))
                    return outputVar
                })
                .then(async outputVar => {
                    const filter = (reaction, user) => user.id !== message.client.user.id;
                    outputVar[1] = outputVar[0].createReactionCollector(filter, {
                        time: song.duration > 0 ? song.duration * 1000 : 600000
                    });
                    return outputVar;
                })
           // console.log(output1);
            return output1

        }*/
        var outputArray = await npMessage(message, song);
        //console.log("outputArray:", outputArray);
        var [playingMessage, collector] = outputArray
        //var playingMessage = musicChannel.messages.cache.get(playingMessageId)
        //console.log(playingMessage);
        //console.log(collector);

        /*var playingMessage = await queue.textChannel.send(
          i18n.__mf("play.startedPlaying", { title: song.title, url: song.url })
        );
        await playingMessage.react("⏭");
        await playingMessage.react("⏯");
        await playingMessage.react("🔇");
        await playingMessage.react("🔉");
        await playingMessage.react("🔊");
        await playingMessage.react("🔁");
        await playingMessage.react("⏹");*/

        //console.log(playingMessage);

        console.log(queue.playing);
        collector.on("collect", (reaction, user) => {
            if (!queue) return;
            const member = message.guild.member(user);

            switch (reaction.emoji.name) {
                case "⏭":
                    queue.playing = true;
                    reaction.users.remove(user).catch(console.error);
                    if (!canModifyQueue(member)) return queue.textChannel
                        .send(i18n.__("common.errorNotChannel"))
                        .then(msg => {
                            msg.delete({ timeout: MSGTIMEOUT })
                        })
                        .catch(console.error);;
                    queue.connection.dispatcher.end();
                    queue.textChannel
                        .send(i18n.__mf("play.skipSong", { author: user }))
                        .then(msg => {
                            msg.delete({ timeout: MSGTIMEOUT })
                        })
                        .catch(console.error);
                    collector.stop();
                    break;

                case "⏯":
                    reaction.users.remove(user).catch(console.error);
                    if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
                    if (queue.playing) {
                        queue.playing = !queue.playing;
                        console.log(queue.playing);
                        queue.connection.dispatcher.pause(true);
                        queue.textChannel
                            .send(i18n.__mf("play.pauseSong", { author: user }))
                            .then(msg => {
                                msg.delete({ timeout: MSGTIMEOUT })
                            })
                            .catch(console.error);
                    } else {
                        queue.playing = !queue.playing;
                        console.log(queue.playing);
                        queue.connection.dispatcher.resume();
                        queue.textChannel
                            .send(i18n.__mf("play.resumeSong", { author: user }))
                            .then(msg => {
                                msg.delete({ timeout: MSGTIMEOUT })
                            })
                            .catch(console.error);
                    }
                    break;

                case "🔇":
                    reaction.users.remove(user).catch(console.error);
                    if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
                    if (queue.volume <= 0) {
                        queue.volume = 100;
                        queue.connection.dispatcher.setVolumeLogarithmic(100 / 100);
                        queue.textChannel
                            .send(i18n.__mf("play.unmutedSong", { author: user }))
                            .then(msg => {
                                msg.delete({ timeout: MSGTIMEOUT })
                            })
                            .catch(console.error);
                    } else {
                        queue.volume = 0;
                        queue.connection.dispatcher.setVolumeLogarithmic(0);
                        queue.textChannel
                            .send(i18n.__mf("play.mutedSong", { author: user }))
                            .then(msg => {
                                msg.delete({ timeout: MSGTIMEOUT })
                            })
                            .catch(console.error);
                    }
                    break;

                case "🔉":
                    reaction.users.remove(user).catch(console.error);
                    if (queue.volume == 0) return;
                    if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
                    if (queue.volume - 10 <= 0) queue.volume = 0;
                    else queue.volume = queue.volume - 10;
                    queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
                    queue.textChannel
                        .send(
                            i18n.__mf("play.decreasedVolume", {
                                author: user,
                                volume: queue.volume
                            })
                        ).then(msg => {
                            msg.delete({ timeout: MSGTIMEOUT })
                        })
                        .catch(console.error);
                    break;

                case "🔊":
                    reaction.users.remove(user).catch(console.error);
                    if (queue.volume == 100) return;
                    if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
                    if (queue.volume + 10 >= 100) queue.volume = 100;
                    else queue.volume = queue.volume + 10;
                    queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
                    queue.textChannel
                        .send(
                            i18n.__mf("play.increasedVolume", {
                                author: user,
                                volume: queue.volume
                            })
                        ).then(msg => {
                            msg.delete({ timeout: MSGTIMEOUT })
                        })
                        .catch(console.error);
                    break;

                case "🔁":
                    reaction.users.remove(user).catch(console.error);
                    if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
                    queue.loop = !queue.loop;
                    queue.textChannel
                        .send(
                            i18n.__mf("play.loopSong", {
                                author: user,
                                loop: queue.loop ? i18n.__("common.on") : i18n.__("common.off")
                            })
                        ).then(msg => {
                            msg.delete({ timeout: MSGTIMEOUT })
                        })
                        .catch(console.error);
                    break;

                case "⏹":
                    reaction.users.remove(user).catch(console.error);
                    if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
                    queue.songs = [];
                    queue.textChannel
                        .send(i18n.__mf("play.stopSong", { author: user }))
                        .then(msg => {
                            msg.delete({ timeout: MSGTIMEOUT })
                        })
                        .catch(console.error);
                    try {
                        queue.connection.dispatcher.end();
                    } catch (error) {
                        console.error(error);
                        queue.connection.disconnect();
                    }
                    //collector.stop();
                    break;

                default:
                    //reaction.users.remove(user).catch(console.error);
                    break;
            }
        });

        collector.on("end", () => {
            /*playingMessage.reactions.removeAll().catch(console.error);
            if (PRUNING && playingMessage && !playingMessage.deleted) {
                playingMessage.delete({ timeout: 3000 }).catch(console.error);
            }*/
        });

    }
};
