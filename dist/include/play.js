"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.play = void 0;
const tslib_1 = require("tslib");
const play_dl_1 = tslib_1.__importDefault(require("play-dl"));
const npmessage_1 = require("./npmessage");
const utils_1 = require("../include/utils");
const responses_1 = require("./responses");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const voice = tslib_1.__importStar(require("@discordjs/voice"));
const discord_js_1 = require("discord.js");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
async function getResource(queue) {
    const song = queue.songs[0];
    let source = null;
    if (song?.url.includes('youtube.com')) {
        try {
            source = await play_dl_1.default.stream(song.url, {
                discordPlayerCompatibility: false,
            });
            if (!source)
                throw new Error('No stream found');
        }
        catch (error) {
            console.error(error);
            return Promise.reject();
        }
    }
    else
        return Promise.reject();
    const resource = voice.createAudioResource(source.stream, {
        inputType: source.type,
    });
    return resource;
}
async function play({ song, message, interaction }) {
    let i;
    if (interaction) {
        i = interaction;
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false });
        }
    }
    else if (message) {
        i = message;
    }
    else {
        return;
    }
    const GUILDID = i.guildId;
    if (i === undefined)
        return;
    var queue = i.client.queue.get(GUILDID);
    const connection = voice.getVoiceConnection(GUILDID);
    const { VoiceConnectionStatus, AudioPlayerStatus } = voice;
    if (queue === undefined)
        return;
    if (!connection)
        return;
    let attempts = 0;
    let resource = {};
    while (!(queue?.songs.length < 1 || attempts >= 5)) {
        resource = await getResource(queue);
        if (resource) {
            break;
        }
        else {
            attempts++;
            queue.songs.shift();
            (0, responses_1.followUp)({
                message,
                interaction,
                content: i18n_1.default.__mf('play.queueError'),
                ephemeral: true,
            });
        }
    }
    if (!resource) {
        return (0, responses_1.followUp)({
            message,
            interaction,
            content: i18n_1.default.__mf('play.queueFail'),
            ephemeral: true,
        });
    }
    const player = voice.createAudioPlayer({
        behaviors: { noSubscriber: voice.NoSubscriberBehavior.Pause },
    });
    player.on('error', (error) => {
        console.error(`Error: ${error.message} with resource`);
    });
    try {
        player.play(resource);
    }
    catch (error) {
        console.error(error);
    }
    connection.subscribe(player);
    const { npmessage, collector } = await (0, npmessage_1.npMessage)({
        message,
        interaction,
        npSong: song,
    });
    if (npmessage === undefined || npmessage === null) {
        return (0, responses_1.followUp)({ message, interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
    }
    if (collector === undefined || collector === null) {
        return (0, responses_1.followUp)({ message, interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
    }
    queue.player = player;
    queue.collector = collector;
    i.client.queue.set(i.guildId, queue);
    collector.on('collect', async (int) => {
        if (!int)
            return;
        if (!int.replied && !int.deferred) {
            try {
                await int.deferReply();
            }
            catch (error) {
                console.error(error);
            }
        }
        const member = int.member;
        if (!member)
            return;
        const name = member.id;
        const queue = int.client.queue.get(int.guild.id);
        if (queue === undefined) {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('queue.errorNotQueue'), ephemeral: true });
            return;
        }
        switch (int.customId) {
            case 'playpause': {
                if (!(0, utils_1.canModifyQueue)(member)) {
                    return int
                        .editReply({ content: i18n_1.default.__('common.errorNotChannel') })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                if (queue.playing) {
                    queue.playing = false;
                    player.pause();
                    int.editReply({
                        content: i18n_1.default.__mf('play.pauseSong', { author: name }),
                    })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                else {
                    queue.playing = true;
                    player.unpause();
                    int.editReply({
                        content: i18n_1.default.__mf('play.resumeSong', { author: name }),
                    })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                break;
            }
            case 'skip': {
                if (!(0, utils_1.canModifyQueue)(member)) {
                    return int
                        .editReply({ content: i18n_1.default.__('common.errorNotChannel') })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                int.editReply({
                    content: i18n_1.default.__mf('play.skipSong', { author: name }),
                })
                    .then((reply) => {
                    setTimeout(() => {
                        if ('delete' in reply) {
                            reply.delete().catch(console.error);
                        }
                    }, utils_1.MSGTIMEOUT);
                })
                    .catch(console.error);
                if (queue.loop) {
                    let last = queue.songs.shift();
                    queue.songs.push(last);
                }
                else {
                    queue.songs.shift();
                }
                collector.stop('skipSong');
                connection.removeAllListeners();
                player.removeAllListeners();
                player.stop();
                if (queue.songs.length > 0) {
                    play({
                        song: queue.songs[0],
                        message,
                        interaction: int,
                    });
                }
                else {
                    (0, npmessage_1.npMessage)({
                        message,
                        interaction: int,
                    });
                }
                break;
            }
            case 'loop': {
                if (!(0, utils_1.canModifyQueue)(member)) {
                    return int
                        .editReply({ content: i18n_1.default.__('common.errorNotChannel') })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                if (int.message.components !== null && int.message.components !== undefined) {
                    queue.loop = !queue.loop;
                    let oldRow = int.message.components[0];
                    if (queue.loop && 'setStyle' in int.component) {
                        int.component.setStyle('SUCCESS');
                    }
                    else if (!queue.loop && 'setStyle' in int.component) {
                        int.component.setStyle('SECONDARY');
                    }
                    let buttons = oldRow.components;
                    for (let i = 0; i < oldRow.components.length; i++) {
                        if (buttons[i].customId === 'loop') {
                            buttons[i] = int.component;
                        }
                    }
                    oldRow.components = buttons;
                    if ('edit' in int.message) {
                        int.message.edit({ components: [oldRow] });
                    }
                }
                int.editReply({
                    content: i18n_1.default.__mf('play.loopSong', {
                        author: name,
                        loop: queue.loop ? i18n_1.default.__('common.on') : i18n_1.default.__('common.off'),
                    }),
                })
                    .then((reply) => {
                    setTimeout(() => {
                        if ('delete' in reply) {
                            reply.delete().catch(console.error);
                        }
                    }, utils_1.MSGTIMEOUT);
                })
                    .catch(console.error);
                break;
            }
            case 'shuffle': {
                if (!queue) {
                    return int
                        .editReply({ content: i18n_1.default.__('shuffle.errorNotQueue') })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                if (!(0, utils_1.canModifyQueue)(member)) {
                    return int
                        .editReply({ content: i18n_1.default.__('common.errorNotChannel') })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                const { songs } = queue;
                for (let i = songs.length - 1; i > 1; i--) {
                    let j = 1 + Math.floor(Math.random() * i);
                    [songs[i], songs[j]] = [songs[j], songs[i]];
                }
                queue.songs = songs;
                if (!int.guildId)
                    return;
                int.client.queue.set(int.guildId, queue);
                (0, npmessage_1.npMessage)({ interaction: int, npSong: song });
                int.editReply({
                    content: i18n_1.default.__mf('shuffle.result', {
                        author: name,
                    }),
                })
                    .then((reply) => {
                    setTimeout(() => {
                        if ('delete' in reply) {
                            reply.delete().catch(console.error);
                        }
                    }, utils_1.MSGTIMEOUT);
                })
                    .catch(console.error);
                break;
            }
            case 'stop': {
                let perms = member.permissions;
                if (!perms.has('ADMINISTRATOR') && !(0, utils_1.canModifyQueue)(member)) {
                    return int
                        .editReply({
                        content: i18n_1.default.__('common.errorNotChannel'),
                    })
                        .then((reply) => {
                        setTimeout(() => {
                            if ('delete' in reply) {
                                reply.delete().catch(console.error);
                            }
                        }, utils_1.MSGTIMEOUT);
                    })
                        .catch(console.error);
                }
                int.editReply({
                    content: i18n_1.default.__mf('play.stopSong', { author: name }),
                })
                    .then((reply) => {
                    setTimeout(() => {
                        if ('delete' in reply) {
                            reply.delete().catch(console.error);
                        }
                    }, utils_1.MSGTIMEOUT);
                })
                    .catch(console.error);
                try {
                    queueEnd(int, npmessage);
                    (0, npmessage_1.npMessage)({ interaction: int });
                    player.stop();
                    collector.stop();
                }
                catch (error) {
                    console.error(error);
                    if (connection?.state?.status !== VoiceConnectionStatus.Destroyed) {
                        connection.destroy();
                    }
                }
                break;
            }
        }
    });
    function queueEnd(int, npmessage) {
        let queue = int.client.queue.get(i.guildId);
        if (queue) {
            queue.songs.length = 0;
        }
        let oldRow = npmessage.components[0];
        for (let i = 0; i < oldRow.components.length; i++) {
            if (oldRow.components[i].customId === 'loop') {
                oldRow.components[i] = new discord_js_1.MessageButton()
                    .setCustomId('loop')
                    .setEmoji('🔁')
                    .setStyle('SECONDARY');
            }
        }
        npmessage.edit({ components: [oldRow] });
    }
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                voice.entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                voice.entersState(connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
        }
        catch (error) {
            if (connection?.state?.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
            i.client.queue.delete(GUILDID);
        }
    });
    player.on(AudioPlayerStatus.Idle, async () => {
        try {
            await Promise.race([
                voice.entersState(player, AudioPlayerStatus.Playing, 1000),
                voice.entersState(player, AudioPlayerStatus.Buffering, 1000),
                voice.entersState(player, AudioPlayerStatus.Paused, 1000),
            ]);
        }
        catch (error) {
            const timeout = setTimeout(() => {
                if (queue === undefined) {
                    (0, responses_1.reply)({ interaction, content: i18n_1.default.__('queue.errorNotQueue'), ephemeral: true });
                    return;
                }
                if (queue.songs.length >= 1) {
                    play({
                        song: queue.songs[0],
                        message,
                        interaction,
                    });
                    return;
                }
                queueEnd(i, npmessage);
                player.removeAllListeners();
                i.client.queue.delete(i.guildId);
                connection?.removeAllListeners();
                connection?.destroy();
                (0, responses_1.followUp)({
                    message,
                    interaction,
                    content: i18n_1.default.__('play.queueEnded') + '\n' + i18n_1.default.__('play.leaveChannel'),
                    ephemeral: false,
                });
                return;
            }, utils_1.STAY_TIME * 1000);
            if (!queue) {
                clearTimeout(timeout);
                (0, npmessage_1.npMessage)({ message, interaction });
                connection.destroy();
                player.stop();
                return;
            }
            queue.timeout = timeout;
            if (queue.songs.length > 1 && !queue?.loop) {
                clearTimeout(timeout);
                queue.songs.shift();
                play({
                    song: queue.songs[0],
                    message,
                    interaction,
                });
            }
            else if (queue.songs.length >= 1 && queue.loop) {
                clearTimeout(timeout);
                let lastSong = queue.songs.shift();
                queue.songs.push(lastSong);
                play({
                    song: queue.songs[0],
                    message,
                    interaction,
                });
            }
            else if (queue.songs.length === 1 && !queue.loop) {
                clearTimeout(timeout);
                (0, npmessage_1.npMessage)({ message, interaction });
                queue.songs.shift();
                setTimeout(() => {
                    if (queue === undefined) {
                        (0, responses_1.reply)({ interaction, content: i18n_1.default.__('queue.errorNotQueue'), ephemeral: true });
                        return;
                    }
                    if (queue.songs.length >= 1) {
                        play({
                            song: queue.songs[0],
                            message,
                            interaction,
                        });
                        return;
                    }
                    queueEnd(i, npmessage);
                    connection?.destroy();
                    (0, responses_1.followUp)({
                        message,
                        interaction,
                        content: i18n_1.default.__('play.queueEnded') + '\n' + i18n_1.default.__('play.leaveChannel'),
                        ephemeral: false,
                    });
                    return i.client.queue.delete(GUILDID);
                }, utils_1.STAY_TIME * 1000);
            }
            connection?.removeAllListeners();
            if (collector && !collector.ended) {
                collector.stop('idleQueue');
            }
        }
    });
    player.on(AudioPlayerStatus.AutoPaused, async () => {
        try {
            await Promise.race([
                voice.entersState(player, AudioPlayerStatus.Playing, 5000),
                voice.entersState(player, AudioPlayerStatus.Buffering, 5000),
                voice.entersState(player, AudioPlayerStatus.Paused, 5000),
            ]);
        }
        catch (error) {
            try {
                if (connection?.state?.status !== VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                    throw new Error('Test Error');
                }
                if (player) {
                    queueEnd(i, npmessage);
                    player.stop();
                }
            }
            finally {
                (0, responses_1.followUp)({
                    message,
                    interaction,
                    content: i18n_1.default.__('play.queueEnded') + '\n' + i18n_1.default.__('play.leaveChannel'),
                    ephemeral: false,
                });
                i.client.queue.delete(GUILDID);
                (0, npmessage_1.npMessage)({ message, interaction });
            }
        }
    });
    i.client.on('voiceStateUpdate', (oldState, newState) => {
        if (queue === undefined) {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('queue.errorNotQueue'), ephemeral: true });
            return;
        }
        if (oldState === null || newState === null)
            return;
        if (newState.member.user.bot)
            return;
        if (oldState.channelId === queue.connection.joinConfig.channelId && !newState.channelId) {
            setTimeout(() => {
                if (oldState.channel.members.size > 1)
                    return;
                i.client.queue.delete(GUILDID);
                queueEnd(i, npmessage);
                player.removeAllListeners();
                player.stop();
                connection?.destroy();
                (0, npmessage_1.npMessage)({ message, interaction });
                (0, responses_1.followUp)({
                    message,
                    interaction,
                    content: i18n_1.default.__('play.queueEnded') + '\n' + i18n_1.default.__('play.leaveChannel'),
                    ephemeral: false,
                });
                return;
            }, utils_1.STAY_TIME * 1000);
        }
    });
}
exports.play = play;
//# sourceMappingURL=play.js.map