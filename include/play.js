const ytdl = require('ytdl-core-discord');
const scdl = require('soundcloud-downloader').default;

const {
	canModifyQueue,
	STAY_TIME,
	LOCALE,
	MSGTIMEOUT,
	SOUNDCLOUD_CLIENT_ID,
} = require(`${__base}include/utils`);
const i18n = require('i18n');
const voice = require('@discordjs/voice');

i18n.setLocale(LOCALE);
// TODO FIX THIS REF WHEN MOVED COMMAND TO COMMANDO
// const np = require('../commands/music/nowplaying');
const { npMessage } = require(`${__base}include/npmessage`);

module.exports = {
	async play(song, message, prefix) {
		const queue = message.client.queue.get(message.guildId);
		const connection = voice.getVoiceConnection(message.guildId);

		if (queue) {
			const npSong = queue.songs[0];
			npMessage({ message, npSong, prefix });
		}
		if (!song) {
			setTimeout(() => {
				if (connection && message.guild.me.voice.channel) return;
				connection.destroy();
				queue.textChannel.send(i18n.__('play.leaveChannel'))
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					}).catch(console.error);
			}, STAY_TIME * 1000);
			queue.textChannel.send(i18n.__('play.queueEnded'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				}).catch(console.error);
			return message.client.queue.delete(message.guild.id);
		}
		let stream = null;
		let streamType = song.url.includes('youtube.com') ? 'opus' : 'ogg/opus';

		try {
			if (song.url.includes('youtube.com')) {
				stream = await ytdl(song.url, { highWaterMark: 1 << 25 });
			} else if (song.url.includes('soundcloud.com')) {
				try {
					stream = await scdl.downloadFormat(
						song.url,
						scdl.FORMATS.OPUS,
						SOUNDCLOUD_CLIENT_ID,
					);
				} catch (error) {
					stream = await scdl.downloadFormat(
						song.url,
						scdl.FORMATS.MP3,
						SOUNDCLOUD_CLIENT_ID,
					);
					streamType = 'unknown';
				}
			}
		} catch (error) {
			if (queue) {
				queue.songs.shift();
				module.exports.play(queue.songs[0], message, prefix);
			}

			console.error(error);
			return message.channel.send(
				i18n.__mf('play.queueError', {
					error: error.message ? error.message : error,
				}),
			).then((msg) => {
				setTimeout(() => msg.delete(), MSGTIMEOUT);
			}).catch(console.error);
		}

		queue.connection.on('disconnect', () => message.client.queue.delete(message.guild.id));
		let collector;
		const { VoiceConnectionStatus, AudioPlayerStatus } = voice;

		const resource = voice.createAudioResource(stream);
		const player = voice.createAudioPlayer({ behaviors: { noSubscriber: voice.NoSubscriberBehavior.Pause } });
		// pass stream to audio player
		player.play(resource);
		player.on(AudioPlayerStatus.Idle, () => {
			if (collector && !collector.ended) collector.stop();
			console.log(queue.loop);
			if (queue.loop) {
				// if loop is on, push the song to the end of the queue
				// so it can repeat endlessly
				const lastSong = queue.songs.shift();
				queue.songs.push(lastSong);
				module.exports.play(queue.songs[0], message, prefix);
			} else {
				// Recursively play the next song
				queue.songs.shift();
				module.exports.play(queue.songs[0], message, prefix);
			}
		});
		player.on('error', (error) => {
			console.error(`Error: ${error.message} with resource`);
		});

		connection.on(VoiceConnectionStatus.Ready, () => {
			console.log('connection ready');

			const subsciption = connection.subscribe(player);
		});

		// Check if disconnect is real or is moving to another channel
		connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
			try {
				await Promise.race([
					voice.entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
					voice.entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
				]);
				// Seems to be reconnecting to a new channel - ignore disconnect
			} catch (error) {
				// Seems to be a real disconnect which SHOULDN'T be recovered from
				connection.destroy();
			}
		});
		/* const dispatcher = queue.connection
			.play(stream, { type: streamType })
			.on('finish', () => {
				if (collector && !collector.ended) collector.stop();

				if (queue.loop) {
					// if loop is on, push the song back at the end of the queue
					// so it can repeat endlessly
					const lastSong = queue.songs.shift();
					queue.songs.push(lastSong);
					module.exports.play(queue.songs[0], message);
				} else {
					// Recursively play the next song
					queue.songs.shift();
					module.exports.play(queue.songs[0], message);
				}
			})
			.on('error', err => {
				console.error(err);
				queue.songs.shift();
				module.exports.play(queue.songs[0], message);
			});
		dispatcher.setVolumeLogarithmic(queue.volume / 100);
		 */
		// vvv Do not remove comma!! it is to skip the first item in the array
		[, collector] = await npMessage({ message, npSong: song });

		collector.on('collect', (reaction, user) => {
			if (!queue) return;
			const member = message.guild.members.cache.get(user.id);

			switch (reaction.emoji.name) {
				case '⏯':
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) return i18n.__('common.errorNotChannel');
					if (queue.playing) {
						queue.playing = !queue.playing;
						player.pause();
						// queue.connection.dispatcher.pause(true);
						queue.textChannel
							.send(i18n.__mf('play.pauseSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							}).catch(console.error);
					} else {
						queue.playing = !queue.playing;
						player.unpause();
						// queue.connection.dispatcher.resume();
						queue.textChannel
							.send(i18n.__mf('play.resumeSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							}).catch(console.error);
					}
					break;

				case '⏭':
					queue.playing = true;
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) {
						return queue.textChannel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							}).catch(console.error);
					}
					player.stop();
					// queue.connection.dispatcher.end();
					queue.textChannel
						.send(i18n.__mf('play.skipSong', { author: user }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						}).catch(console.error);
					collector.stop();
					break;
				/* case '🔇':
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) return i18n.__('common.errorNotChannel');
					if (queue.volume <= 0) {
						queue.volume = 100;
						queue.connection.dispatcher.setVolumeLogarithmic(100 / 100);
						queue.textChannel
							.send(i18n.__mf('play.unmutedSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							}).catch(console.error);
					} else {
						queue.volume = 0;
						queue.connection.dispatcher.setVolumeLogarithmic(0);
						queue.textChannel
							.send(i18n.__mf('play.mutedSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							}).catch(console.error);
					}
					break;

				case '🔉':
					reaction.users.remove(user).catch(console.error);
					if (queue.volume == 0) return;
					if (!canModifyQueue(member)) return i18n.__('common.errorNotChannel');
					if (queue.volume - 10 <= 0) queue.volume = 0;
					else queue.volume = queue.volume - 10;
					queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
					queue.textChannel
						.send(
							i18n.__mf('play.decreasedVolume', {
								author: user,
								volume: queue.volume
							})
						).then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						}).catch(console.error);
					break;

				case '🔊':
					reaction.users.remove(user).catch(console.error);
					if (queue.volume == 100) return;
					if (!canModifyQueue(member)) return i18n.__('common.errorNotChannel');
					if (queue.volume + 10 >= 100) queue.volume = 100;
					else queue.volume = queue.volume + 10;
					queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
					queue.textChannel
						.send(
							i18n.__mf('play.increasedVolume', {
								author: user,
								volume: queue.volume
							})
						).then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						}).catch(console.error);
					break;
*/
				case '🔁':
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) return i18n.__('common.errorNotChannel');
					queue.loop = !queue.loop;
					queue.textChannel
						.send(
							i18n.__mf('play.loopSong', {
								author: user,
								loop: queue.loop ? i18n.__('common.on') : i18n.__('common.off'),
							}),
						).then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						}).catch(console.error);
					break;

				case '⏹':
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) return i18n.__('common.errorNotChannel');
					queue.songs = [];
					queue.textChannel
						.send(i18n.__mf('play.stopSong', { author: user }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						}).catch(console.error);
					try {
						player.stop();
						// queue.connection.dispatcher.end();
						npMessage({ message });
					} catch (error) {
						console.error(error);
						connection.disconnect();
						// queue.connection.disconnect();
					}
					// collector.stop();
					break;

				default:
					// reaction.users.remove(user).catch(console.error);
					break;
			}
		});

		collector.on('end', () => {
			/* playingMessage.reactions.removeAll().catch(console.error);
			if (PRUNING && playingMessage && !playingMessage.deleted) {
				playingMessage.delete({ timeout: 3000 }).catch(console.error);
			} */
			//
		});
	},
};
