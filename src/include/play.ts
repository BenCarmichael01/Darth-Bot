/* global __base */
import playdl from 'play-dl';
import { npMessage } from './npmessage';
import { canModifyQueue, STAY_TIME, LOCALE, MSGTIMEOUT } from '../include/utils';
import { followUp } from './responses';
import i18n from 'i18n';
import voice, { AudioResource, VoiceConnection } from '@discordjs/voice';
import { GuildMember, Message, MessageButton } from 'discord.js';
import { IQueue } from 'src/types/typings';

if (LOCALE) i18n.setLocale(LOCALE);

/**
 *
 * @param {IQueue} queue
 * @returns {AudioResource} DiscordAudioResource of the first song in the queue
 */
async function getResource(queue: IQueue): Promise<voice.AudioResource> {
	const song = queue.songs[0];
	// Get stream from song Url //
	let source = null;
	if (song?.url.includes('youtube.com')) {
		try {
			source = await playdl.stream(song.url, {
				discordPlayerCompatibility: false,
			});
			if (!source) throw new Error('No stream found');
		} catch (error) {
			console.error(error);
			return Promise.reject();
		}
	} else return Promise.reject();
	const resource = voice.createAudioResource(source.stream, {
		inputType: source.type,
	});
	return resource;
}
	/**
	 * @name play
	 * @param {*} song
	 * @param {DiscordMessage} message
	 * @param {String} prefix
	 * @returns undefined
	 */
export default async function play({ song, message, interaction, prefix }: any): Promise<any> {
		let i;
		if (interaction) {
			i = interaction;
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ ephemeral: false });
			}
		} else if (message) {
			i = message;
	}
		if (!i) return;	
		var queue = i.client.queue.get(i.guildId);
		const connection = voice.getVoiceConnection(i.guildId);
		const { VoiceConnectionStatus, AudioPlayerStatus } = voice;

	if (!queue) return;
	if (!connection) return;
		let attempts = 0;
		let resource = {};
		while (!(queue?.songs.length < 1 || attempts >= 5)) {
			resource = await getResource(queue);
			if (resource) {
				break;
			} else {
				attempts++;
				queue.songs.shift();
				followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError'),
					ephemeral: true,
				});
			}
		}
		if (!resource) {
			return followUp({
				message,
				interaction,
				content: i18n.__mf('play.queueFail'),
				ephemeral: true,
			});
		}
		const player = voice.createAudioPlayer({
			behaviors: { noSubscriber: voice.NoSubscriberBehavior.Pause },
		});
		queue.player = player;
		/*-----------------Event Listeners-------------------------*/
		player.on('error', (error) => {
			console.error(`Error: ${error.message} with resource`);
		});
		// pass stream to audio player
		try {
			player.play(resource as AudioResource);
		} catch (error) {
			console.error(error);
		}
		connection.subscribe(player);

		// vvv Do not remove comma!! it is to skip the first item in the array
		const { npmessage, collector } = await npMessage({
			message,
			interaction,
			npSong: song,
		});

	collector?.on('collect', async (int) => {
			if (!int) return;
			await int.deferReply();
			const { member } = int;
			if (!member) return;
			const name = (member as GuildMember).id;
			const queue = await int.client.queue.get(int.guild!.id);
			switch (int.customId) {
				case 'playpause': {
					if (!canModifyQueue(member)) {
						return int
							.editReply({ content: i18n.__('common.errorNotChannel') })
							.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					}
					if (queue.playing) {
						queue.playing = false;
						player.pause();
						int.editReply({
							content: i18n.__mf('play.pauseSong', { author: name }),
						}).then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					} else {
						queue.playing = true;
						player.unpause();
						int.editReply({
							content: i18n.__mf('play.resumeSong', { author: name }),
						})
							.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					}
					break;
				}
				case 'skip': {
					if (!canModifyQueue(member)) {
						return int
							.editReply({ content: i18n.__('common.errorNotChannel') })
							.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					}
					int.editReply({
						content: i18n.__mf('play.skipSong', { author: name }),
					})
						.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);

					if (queue.loop) {
						let last = queue.songs.shift();
						queue.songs.push(last);
					} else {
						queue.songs.shift();
					}
					collector.stop('skipSong');
					connection.removeAllListeners();
					player.removeAllListeners();
					player.stop();
					if (queue.songs.length > 0) {
						module.exports.play({
							song: queue.songs[0],
							message,
							interaction: int,
							prefix,
						});
					} else {
						await npMessage({
							message,
							interaction: int,
						});
					}
					break;
				}
				case 'loop': {
					if (!int) return;
					if (!canModifyQueue(member)) {
						return int
							.editReply({ content: i18n.__('common.errorNotChannel') })
							.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					}
					queue.loop = !queue.loop;
					let oldRow = int.message.components[0];
					if (queue.loop) {
						int.component.setStyle('SUCCESS');
					} else {
						int.component.setStyle('SECONDARY');
					}
					for (let i = 0; i < oldRow.components.length; i++) {
						if (oldRow.components[i].customId === 'loop') {
							oldRow.components[i] = int.component;
						}
					}
					int.message.edit({ components: [oldRow] });
					int.editReply({
						content: i18n.__mf('play.loopSong', {
							author: name,
							loop: queue.loop ? i18n.__('common.on') : i18n.__('common.off'),
						}),
					})
						.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					break;
				}
				case 'shuffle': {
					if (!queue) {
						return int
							.editReply({ content: i18n.__('shuffle.errorNotQueue') })
							.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					}
					if (!canModifyQueue(member)) {
						return int
							.editReply({ content: i18n.__('common.errorNotChannel') })
							.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					}
					const { songs } = queue;
					for (let i = songs.length - 1; i > 1; i--) {
						let j = 1 + Math.floor(Math.random() * i);
						[songs[i], songs[j]] = [songs[j], songs[i]];
					}
					queue.songs = songs;
					int.client.queue.set(int.guildId, queue);
					npMessage({ interaction: int, npSong: song, prefix });
					int.editReply({
						content: i18n.__mf('shuffle.result', {
							author: name,
						}),
					})
						.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					break;
				}
				case 'stop': {
					if (!member.permissions.has('ADMINISTRATOR')) {
						if (!canModifyQueue(member)) {
							return int
								.editReply({
									content: i18n.__('common.errorNotChannel'),
								})
								.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
						}
					}
					int.editReply({
						content: i18n.__mf('play.stopSong', { author: name }),
					})
						.then((reply) => {
								setTimeout(() => {
									if ('delete' in reply) { reply.delete().catch(console.error) }
								}, MSGTIMEOUT as number);
							})
							.catch(console.error);
					try {
						player.emit('queueEnd');
						player.stop();
						npMessage({ message, interaction: int, prefix });
					} catch (error) {
						console.error(error);
						if (connection?.state?.status !== VoiceConnectionStatus.Destroyed) {
							connection.destroy();
						}
					}
					break;
				}
			}
		});

		connection.on('setup', () => {
			try {
				player.stop();
			} catch (error) {
				console.error(error);
			}
			connection.destroy();
			i.client.queue.delete(i.guildId);
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
				i.client.queue.delete(i.guildId);
			}
		});
		player.on('queueEnd', () => {
			i.client.queue.delete(i.guildId);
			let oldRow = npmessage.components[0];
			for (let i = 0; i < oldRow.components.length; i++) {
				if (oldRow.components[i].customId === 'loop') {
					oldRow.components[i] = new MessageButton()
						.setCustomId('loop')
						.setEmoji('🔁')
						.setStyle('SECONDARY');
				}
			}
			npmessage.edit({ components: [oldRow] });
		});
		player.on('jump', () => {
			let queue = i.client.queue.get(i.guildId);
			collector.stop('skipSong');
			connection.removeAllListeners();
			player.removeAllListeners();
			player.stop();
			module.exports.play({
				song: queue.songs[0],
				message,
				interaction,
				prefix,
			});
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
				if (!queue) {
					npMessage({ message, interaction, prefix });
					return setTimeout(() => {
						if (queue?.songs.length >= 1) {
							module.exports.play({
								song: queue.songs[0],
								message,
								interaction,
								prefix,
							});
							return;
						}
						player.emit('queueEnd');
						connection?.destroy();
						followUp({
							message,
							interaction,
							content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
							ephemeral: false,
						});
						return;
					}, STAY_TIME * 1_000);
				}

				if (queue.songs.length > 1 && !queue?.loop) {
					// songs in queue and queue not looped so play next song
					queue.songs.shift();
					module.exports.play({
						song: queue.songs[0],
						message,
						interaction,
						prefix,
					});
				} else if (queue.songs.length >= 1 && queue.loop) {
					// at least one song in queue and queue is looped so push finished
					// song to back of queue then play next song
					let lastSong = queue.songs.shift();
					queue.songs.push(lastSong);
					module.exports.play({
						song: queue.songs[0],
						message,
						interaction,
						prefix,
					});
				} else if (queue.songs.length === 1 && !queue.loop) {
					// If there are no more songs in the queue then wait for STAY_TIME before leaving vc
					// unless a song was added during the timeout
					npMessage({ message, interaction });
					queue.songs.shift();
					setTimeout(() => {
						if (queue.songs.length >= 1) {
							module.exports.play({
								song: queue.songs[0],
								message,
								interaction,
								prefix,
							});
							return;
						}
						player.emit('queueEnd');
						connection?.destroy();
						followUp({
							message,
							interaction,
							content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
							ephemeral: false,
						});
						return i.client.queue.delete(i.guildId);
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
						player.emit('queueEnd');
						player.stop();
					}
				} finally {
					followUp({
						message,
						interaction,
						content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
						ephemeral: false,
					});
					i.client.queue.delete(i.guildId);
					npMessage({ message, interaction, prefix });
				}
			}
		});
		i.client.on('voiceStateUpdate', (oldState, newState) => {
			if (newState.member.user.bot) return;
			if (oldState.channelId === queue.connection.joinConfig.channelId && !newState.channelId) {
				setTimeout(() => {
					if (oldState.channel.members.size > 1) return;
					i.client.queue.delete(i.guildId);
					player.emit('queueEnd');
					player.removeAllListeners();
					player.stop();
					connection?.destroy();
					npMessage({ message, interaction });
					followUp({
						message,
						interaction,
						content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
						ephemeral: false,
					});
					return;
				}, STAY_TIME * 1_000);
			}
		});
	},
