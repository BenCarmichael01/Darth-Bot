/* global __base */
const playdl = require('play-dl');

const { canModifyQueue, STAY_TIME, LOCALE, MSGTIMEOUT } = require(`${__base}include/utils`);
const i18n = require('i18n');
const voice = require('@discordjs/voice');

i18n.setLocale(LOCALE);
// TODO FIX THIS REF WHEN MOVED COMMAND TO COMMANDO
// const np = require('../commands/music/nowplaying');
const { npMessage } = require(`${__base}include/npmessage`);

/**
 *
 * @param {DiscordMessage} message
 * @param {object} queue
 * @returns {DiscordAudioResource} DiscordAudioResource of the first song in the queue
 */
async function getResource(message, queue) {
	const song = queue.songs[0];
	// Get stream from song Url //
	let source = null;
	if (song?.url.includes('youtube.com')) {
		try {
			source = await playdl.stream(song.url, { discordPlayerCompatibility: false });
		} catch (error) {
			console.error(error);
			return false;
		}
	}
	const resource = voice.createAudioResource(source.stream, { inputType: source.type });
	return resource;
}
module.exports = {
	/**
	 * @name play
	 * @param {*} song
	 * @param {DiscordMessage} message
	 * @param {String} prefix
	 * @returns undefined
	 */
	async play(song, message, prefix) {
		const queue = message.client.queue.get(message.guildId);
		const connection = voice.getVoiceConnection(message.guildId);
		const { VoiceConnectionStatus, AudioPlayerStatus } = voice;

		let attempts = 0;
		var resource = {};
		while (!(queue.songs.length < 1 || attempts >= 5)) {
			resource = await getResource(message, queue);
			if (resource) {
				break;
			} else {
				attempts++;
				queue.songs.shift();
				message.channel
					.send(i18n.__mf('play.queueError'))
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
					})
					.catch(console.error);
			}
		}
		if (!resource) {
			return message.channel
				.send(i18n.__mf('play.queueFail'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
				})
				.catch(console.error);
		}
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

		// vvv Do not remove comma!! it is to skip the first item in the array
		const [, collector] = await npMessage({
			message,
			npSong: song,
			prefix,
		});

		collector.on('collect', async (reaction, user) => {
			if (!queue) return;
			const member = reaction.message.guild.members.cache.get(user.id);

			switch (reaction.emoji.name) {
				case '⏯': {
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) {
						return reaction.message.channel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					if (queue.playing) {
						queue.playing = false;
						player.pause();
						reaction.message.channel
							.send(i18n.__mf('play.pauseSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					} else {
						queue.playing = true;
						player.unpause();
						reaction.message.channel
							.send(i18n.__mf('play.resumeSong', { author: user }))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					break;
				}
				case '⏭': {
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) {
						return reaction.message.channel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					reaction.message.channel
						.send(i18n.__mf('play.skipSong', { author: user }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					queue.songs.shift();
					collector.stop('skipSong');
					connection.removeAllListeners();
					player.removeAllListeners();
					player.stop();
					module.exports.play(queue.songs[0], reaction.message, prefix);
					break;
				}
				case '🔁': {
					reaction.users.remove(user).catch(console.error);
					if (!canModifyQueue(member)) {
						return reaction.message.channel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
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
						return reaction.message.channel
							.send(i18n.__('shuffle.errorNotQueue'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					if (!canModifyQueue(message.member)) {
						return reaction.message.channel
							.send(i18n.__('common.errorNotChannel'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
					}
					const { songs } = queue;
					for (let i = songs.length - 1; i > 1; i--) {
						let j = 1 + Math.floor(Math.random() * i);
						[songs[i], songs[j]] = [songs[j], songs[i]];
					}
					queue.songs = songs;
					message.client.queue.set(message.guild.id, queue);
					npMessage({ message, npSong: song, prefix });
					queue.textChannel
						.send(
							i18n.__mf('shuffle.result', {
								author: message.author.id,
							}),
						)
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					break;
				}
				case '⏹': {
					reaction.users.remove(user).catch(console.error);
					if (!member.permissions.has('ADMINISTRATOR')) {
						if (!canModifyQueue(member)) {
							return reaction.message.channel
								.send(i18n.__('common.errorNotChannel'))
								.then((msg) => {
									setTimeout(() => msg.delete(), MSGTIMEOUT);
								})
								.catch(console.error);
						}
					}
					queue.songs = [];
					message.client.queue.delete(message.guild.id);
					reaction.message.channel
						.send(i18n.__mf('play.stopSong', { author: user }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					try {
						player.stop();
						npMessage({ message, prefix });
					} catch (error) {
						console.error(error);
						if (connection?.state?.status !== VoiceConnectionStatus.Destroyed) {
							connection.destroy();
						}
					}
					break;
				}
				default: {
					reaction.users.remove(user).catch(console.error);
					break;
				}
			}
		});

		// Check if disconnect is real or is moving to another channel
		connection.on(VoiceConnectionStatus.Disconnected, async () => {
			try {
				await Promise.race([
					voice.entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
					voice.entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
				]);
				// Seems to be reconnecting to a new channel - ignore disconnect
			} catch (error) {
				// Seems to be a real disconnect which SHOULDN'T be recovered from
				if (connection?.state?.status !== VoiceConnectionStatus.Destroyed) {
					connection.destroy();
				}
				message.client.queue.delete(message.guild.id);
			}
		});
		player.on(AudioPlayerStatus.Idle, async () => {
			try {
				await Promise.race([
					voice.entersState(player, AudioPlayerStatus.Playing, 1_000),
					voice.entersState(player, AudioPlayerStatus.Buffering, 1_000),
					voice.entersState(player, AudioPlayerStatus.Paused, 1_000),
				]);
				// Seems to be transitioning to another resource - ignore idle
			} catch (error) {
				// apears to be finished current song

				// decide what to do:
				if (queue.songs.length > 1 && !queue.loop) {
					// songs in queue and queue not looped so play next song
					queue.songs.shift();
					module.exports.play(queue.songs[0], message, prefix);
				} else if (queue.songs.length >= 1 && queue.loop) {
					// at least one song in queue and queue is looped so push finished
					// song to back of queue then play next song
					let lastSong = queue.songs.shift();
					queue.songs.push(lastSong);
					module.exports.play(queue.songs[0], message, prefix);
				} else if (queue.songs.length === 1 && !queue.loop) {
					// If there are no more songs in the queue then wait for STAY_TIME before leaving vc
					// unless a song was added during the timeout
					npMessage({ message, prefix });
					queue.songs.shift();
					setTimeout(() => {
						if (queue.songs.length >= 1) {
							module.exports.play(queue.songs[0], message, prefix);
							return;
						}
						connection?.destroy();

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
						return message.client.queue.delete(message.guildId);
					}, STAY_TIME * 1_000);
				}
				// must remove these listeners before we call play function again to avoid memory leak and maxListeners exceeded error
				connection?.removeAllListeners();

				// stop for same reason as connection above
				if (collector && !collector.ended) {
					collector.stop(['idleQueue']);
				}
			}
		});
		// player only autopauses when not subscribed to a channel so this listener checks if the player is actually moving to another resource
		// or if the voice connection has been destroyed.
		// Cleans up after destroying connection and player
		player.on(AudioPlayerStatus.AutoPaused, async () => {
			try {
				await Promise.race([
					voice.entersState(player, AudioPlayerStatus.Playing, 5_000),
					voice.entersState(player, AudioPlayerStatus.Buffering, 5_000),
					voice.entersState(player, AudioPlayerStatus.Paused, 5_000),
				]);
				// Seems to be transitioning to another resource - ignore idle
			} catch (error) {
				//
				try {
					if (connection?.state?.status !== VoiceConnectionStatus.Destroyed) {
						connection.destroy();
						throw new Error('Test Error');
					}
					if (player) {
						player.stop();
					}
				} finally {
					message.channel
						.send(i18n.__('play.queueEnded'))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					message.channel
						.send(i18n.__('play.leaveChannel'))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
					message.client.queue.delete(message.guildId);
					npMessage({ message, prefix });
				}
			}
		});
	},
};
