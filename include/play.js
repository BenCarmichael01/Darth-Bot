/* global __base */
const ytdl = require('ytdl-core-discord');

const {
	canModifyQueue,
	STAY_TIME,
	LOCALE,
	MSGTIMEOUT,
} = require(`${__base}include/utils`);
const i18n = require('i18n');
const voice = require('@discordjs/voice');

i18n.setLocale(LOCALE);
// TODO FIX THIS REF WHEN MOVED COMMAND TO COMMANDO
// const np = require('../commands/music/nowplaying');
const { npMessage } = require(`${__base}include/npmessage`);

module.exports = {
	async getResource(message, queue) {
		const song = queue.songs[0];

		// Get stream from song Url //
		let stream = null;
		let info = null;
		// TODO streamline by adding streamType
		// let streamType = song.url.includes('youtube.com') ? 'opus' : 'ogg/opus';
		if (song.url.includes('youtube.com')) {
			try {
				info = await ytdl.getInfo(song.url);
			} catch (error) {
				console.error(error);
				return message.channel
					.send(
						i18n.__mf('play.queueError', {
							error: error.message ? error.message : error,
						}),
					)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
					})
					.catch(console.error);
			}

			try {
				stream = await ytdl.downloadFromInfo(info, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
				// stream = await ytdl.downloadFromInfo(info, { filter: 'audioonly' });
			} catch (error) {
				if (queue) {
					queue.songs.shift();
					module.exports.getResource(message, queue);
				}
				console.error(error);
				return message.channel
					.send(
						i18n.__mf('play.queueError', {
							error: error.message ? error.message : error,
						}),
					)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
					})
					.catch(console.error);
			}
		}
		const resource = voice.createAudioResource(stream);
		return resource;
	},
	async play(song, message, prefix) {
		const queue = message.client.queue.get(message.guildId);
		const connection = voice.getVoiceConnection(message.guildId);

		if (queue) {
			const npSong = queue.songs[0];
			npMessage({ message, npSong, prefix });
		}
		// TODO this timeout part doesn't look like it works at all but haven't tested yet
		if (!song) {
			setTimeout(() => {
				// if (connection && message.guild.me.voice.channel) return;
				connection.destroy();
				queue.textChannel
					.send(i18n.__('play.queueEnded'))
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					})
					.catch(console.error);
				queue.textChannel
					.send(i18n.__('play.leaveChannel'))
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					})
					.catch(console.error);
			}, STAY_TIME * 1_000);

			return message.client.queue.delete(message.guildId);
		}

		const { VoiceConnectionStatus, AudioPlayerStatus } = voice;

		const resource = await module.exports.getResource(message, queue);
		const player = voice.createAudioPlayer({
			behaviors: { noSubscriber: voice.NoSubscriberBehavior.Pause },
		});

		player.on('error', (error) => {
			console.error(`Error: ${error.message} with resource`);
		});
		// pass stream to audio player
		try {
			player.play(resource);
		} catch (error) {
			console.error(error);
		}
		connection.subscribe(player);
		// let collector = {};

		// vvv Do not remove comma!! it is to skip the first item in the array
		const [, collector] = await npMessage({ message, npSong: song });

		collector.on('collect', async (reaction, user) => {
			if (!queue) return;
			const member = message.guild.members.cache.get(user.id);

			switch (reaction.emoji.name) {
				case '⏯': {
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) {
						return reaction.message.channel.send(
							i18n.__('common.errorNotChannel'),
						);
					}
					if (queue.playing) {
						queue.playing = false;
						player.pause();
						// queue.connection.dispatcher.pause(true);
						queue.textChannel
							.send(i18n.__mf('play.pauseSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					} else {
						queue.playing = true;
						player.unpause();
						// queue.connection.dispatcher.resume();
						queue.textChannel
							.send(i18n.__mf('play.resumeSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					break;
				}
				case '⏭': {
					// queue.playing = true;
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) {
						return queue.textChannel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					queue.textChannel
						.send(i18n.__mf('play.skipSong', { author: user }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					queue.songs.shift();
					// const nextResource = await module.exports.getResource(message, queue);
					collector.stop('skipSong');
					connection.removeAllListeners();
					player.removeAllListeners();
					player.stop();
					module.exports.play(queue.songs[0], reaction.message, prefix);
					// player.play(nextResource);
					// queue.connection.dispatcher.end();
					break;
				}
				case '🔁': {
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) return i18n.__('common.errorNotChannel');
					queue.loop = !queue.loop;
					queue.textChannel
						.send(
							i18n.__mf('play.loopSong', {
								author: user,
								loop: queue.loop ? i18n.__('common.on') : i18n.__('common.off'),
							}),
						)
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					break;
				}
				case '🔀': {
					reaction.users.remove(user).catch(console.error);
					if (!queue) {
						return message.channel
							.send(i18n.__('shuffle.errorNotQueue'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					if (!canModifyQueue(message.member)) {
						return message.channel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					const { songs } = queue;
					for (let i = songs.length - 1; i > 1; i--) {
						// eslint-disable-next-line prefer-const
						let j = 1 + Math.floor(Math.random() * i);
						[songs[i], songs[j]] = [songs[j], songs[i]];
					}
					queue.songs = songs;
					message.client.queue.set(message.guild.id, queue);
					npMessage({ message, npSong: song });
					queue.textChannel
						.send(i18n.__mf('shuffle.result', { author: message.author.id }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					break;
				}
				case '⏹': {
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) {
						return message.channel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					queue.songs = [];
					queue.textChannel
						.send(i18n.__mf('play.stopSong', { author: user }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					try {
						player.stop();
						// queue.connection.dispatcher.end();
						npMessage({ message });
					} catch (error) {
						console.error(error);
						connection.destroy();
						// queue.connection.disconnect();
					}
					// collector.stop();
					break;
				}
				default: {
					reaction.users.remove(user).catch(console.error);
					break;
				}
			}
		});

		collector.on('end', () => {
			/* playingMessage.reactions.removeAll().catch(console.error);
				if (PRUNING && playingMessage && !playingMessage.deleted) {
					playingMessage.delete({ timeout: 3000 }).catch(console.error);
				} */
			//
		});
		// need to check if listeners already exist i.e. when playing through queue, to prevent exceeding max listeners
		connection.once(VoiceConnectionStatus.Ready, () => {
			console.log('connection ready');
			// const subsciption = connection.subscribe(player);
		});

		// Check if disconnect is real or is moving to another channel
		connection.on(VoiceConnectionStatus.Disconnected, async () => {
			try {
				await Promise.race([
					voice.entersState(
						connection,
						VoiceConnectionStatus.Signalling,
						5_000,
					),
					voice.entersState(
						connection,
						VoiceConnectionStatus.Connecting,
						5_000,
					),
				]);
				// Seems to be reconnecting to a new channel - ignore disconnect
			} catch (error) {
				// Seems to be a real disconnect which SHOULDN'T be recovered from
				connection.destroy();
				message.client.queue.delete(message.guild.id);
			}
		});
		player.on(AudioPlayerStatus.Idle, async () => {
			console.log('player status Idle');
			try {
				await Promise.race([
					voice.entersState(player, AudioPlayerStatus.Playing, 2_000),
					voice.entersState(player, AudioPlayerStatus.Buffering, 2_000),
					voice.entersState(player, AudioPlayerStatus.AutoPaused, 2_000),
					voice.entersState(player, AudioPlayerStatus.Paused, 2_000),
				]);
				// Seems to be transitioning to another resource - ignore idle
			} catch (error) {
				// apears to be finished queue
				connection.removeAllListeners();
				if (collector && !collector.ended) collector.stop('idleQueue');
				if (queue.loop) {
					// if loop is on, push the song to the end of the queue
					// so it can repeat endlessly
					const lastSong = queue.songs.shift();
					queue.songs.push(lastSong);
					module.exports.play(queue.songs[0], message, prefix);
					// const nextResource = module.exports.getNextResource(message, queue);
					// player.play(nextResource);
				} else {
					// Recursively play the next song
					queue.songs.shift();
					console.log('playing next song');
					module.exports.play(queue.songs[0], message, prefix);
				}
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
	},
};

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
