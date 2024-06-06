/* global __base */
import playdl, { YouTubeStream } from 'play-dl';
import { npMessage } from './npmessage';
import { canModifyQueue, STAY_TIME, LOCALE, MSGTIMEOUT } from '../include/utils';
import { followUp, reply } from './responses';
import i18n from 'i18n';
import * as voice from '@discordjs/voice';
import {
	ButtonBuilder,
	ButtonInteraction,
	CommandInteraction,
	GuildMember,
	InteractionType,
	Message,
	MessageType,
	PermissionFlagsBits,
	Permissions,
} from 'discord.js';
import '../types/types';
import { CustomConnection, CustomPlayer, IQueue, playArgs } from '../types/types';
import makeButtons from './makebuttons';

if (LOCALE) i18n.setLocale(LOCALE);

/**
 *
 * @param {IQueue} queue
 * @returns {AudioResource} DiscordAudioResource of the first song in the queue
 */
async function getResource(queue: IQueue): Promise<voice.AudioResource> {
	const song = queue.songs[0];
	// Get stream from song Url //
	let source: YouTubeStream;
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
export async function play({ song, message, interaction }: playArgs): Promise<any> {
	let i: CommandInteraction | Message;
	if (interaction) {
		i = interaction as CommandInteraction;
		if (!interaction.deferred && !interaction.replied) {
			await interaction.deferReply({ ephemeral: false });
		}
	} else if (message) {
		i = message as Message;
	} else {
		return;
	}
	const GUILDID = i.guildId as string;

	if (i === undefined) return;
	var queue = i.client.queue.get(GUILDID);
	const connection = voice.getVoiceConnection(GUILDID) as CustomConnection & voice.VoiceConnection;
	const { VoiceConnectionStatus, AudioPlayerStatus } = voice;

	if (queue === undefined) return;
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
	}) as CustomPlayer & voice.AudioPlayer;

	/*-----------------Event Listeners-------------------------*/
	player.on('error', (error: voice.AudioPlayerError) => {
		console.error(`Error: ${error.message} with resource`);
	});
	// pass stream to audio player
	try {
		player.play(resource as voice.AudioResource);
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
	if (npmessage === undefined || npmessage === null) {
		return followUp({ message, interaction, content: i18n.__('common.unknownError'), ephemeral: true });
	}
	if (collector === undefined || collector === null) {
		return followUp({ message, interaction, content: i18n.__('common.unknownError'), ephemeral: true });
	}
	queue.player = player;
	queue.collector = collector;

	i.client.queue.set(i.guildId!, queue);

	collector.on('collect', async (int: ButtonInteraction) => {
		if (!int) return;
		if (!int.replied && !int.deferred) {
			try {
				await int.deferReply();
			} catch (error) {
				console.error(error);
			}
		}
		const member = int.member as GuildMember;
		if (!member) return;
		const name = member.id;
		const queue = int.client.queue.get(int.guild!.id);
		if (queue === undefined) {
			reply({ interaction, content: i18n.__('queue.errorNotQueue'), ephemeral: true });
			return;
		}
		switch (int.customId) {
			case 'playpause': {
				if (!canModifyQueue(member)) {
					return int
						.editReply({ content: i18n.__('common.errorNotChannel') })
						.then((reply) => {
							setTimeout(() => {
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
							}, MSGTIMEOUT as number);
						})
						.catch(console.error);
				}
				if (queue.playing) {
					queue.playing = false;
					player.pause();
					int.editReply({
						content: i18n.__mf('play.pauseSong', { author: name }),
					})
						.then((reply) => {
							setTimeout(() => {
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
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
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
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
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
							}, MSGTIMEOUT as number);
						})
						.catch(console.error);
				}
				int.editReply({
					content: i18n.__mf('play.skipSong', { author: name }),
				})
					.then((reply) => {
						setTimeout(() => {
							if ('delete' in reply) {
								reply.delete().catch(console.error);
							}
						}, MSGTIMEOUT as number);
					})
					.catch(console.error);

				if (queue.loop) {
					let last = queue.songs.shift();
					if (!last) throw new Error('Cannot shift songs.\nLooping failed');
					queue.songs.push(last);
				} else {
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
				} else {
					npMessage({
						message,
						interaction: int,
					});
				}
				break;
			}
			case 'loop': {
				if (!canModifyQueue(member)) {
					return int
						.editReply({ content: i18n.__('common.errorNotChannel') })
						.then((reply) => {
							setTimeout(() => {
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
							}, MSGTIMEOUT as number);
						})
						.catch(console.error);
				}
				if (int.message.components !== null && int.message.components !== undefined) {
					queue.loop = !queue.loop;
					let content = int.message.content;
					let embeds = int.message.embeds;

					if (queue.loop) {
						let buttons = makeButtons(true);
						int.update({ content, embeds, components: [buttons]
						})
					} else if (!queue.loop) {
						let buttons = makeButtons(false);
						int.update({ content, embeds, components: [buttons]
						})
					}
				}
				int.editReply({
					content: i18n.__mf('play.loopSong', {
						author: name,
						loop: queue.loop ? i18n.__('common.on') : i18n.__('common.off'),
					}),
				})
					.then((reply) => {
						setTimeout(() => {
							if ('delete' in reply) {
								reply.delete().catch(console.error);
							}
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
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
							}, MSGTIMEOUT as number);
						})
						.catch(console.error);
				}
				if (!canModifyQueue(member)) {
					return int
						.editReply({ content: i18n.__('common.errorNotChannel') })
						.then((reply) => {
							setTimeout(() => {
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
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
				if (!int.guildId) return;
				int.client.queue.set(int.guildId, queue);
				npMessage({ interaction: int, npSong: song });
				int.editReply({
					content: i18n.__mf('shuffle.result', {
						author: name,
					}),
				})
					.then((reply) => {
						setTimeout(() => {
							if ('delete' in reply) {
								reply.delete().catch(console.error);
							}
						}, MSGTIMEOUT as number);
					})
					.catch(console.error);
				break;
			}
			case 'stop': {
				let perms = member.permissions;
				if (!perms.has(PermissionFlagsBits.Administrator) && !canModifyQueue(member)) {
					return int
						.editReply({
							content: i18n.__('common.errorNotChannel'),
						})
						.then((reply) => {
							setTimeout(() => {
								if ('delete' in reply) {
									reply.delete().catch(console.error);
								}
							}, MSGTIMEOUT as number);
						})
						.catch(console.error);
				}
				int.editReply({
					content: i18n.__mf('play.stopSong', { author: name }),
				})
					.then((reply) => {
						setTimeout(() => {
							if ('delete' in reply) {
								reply.delete().catch(console.error);
							}
						}, MSGTIMEOUT as number);
					})
					.catch(console.error);
				try {
					queueEnd(int, npmessage);
					npMessage({ interaction: int });
					player.stop();
					collector.stop();
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

	function queueEnd(int: CommandInteraction | ButtonInteraction | Message, npmessage: Message) {
		let queue = int.client.queue.get(i.guildId!);
		if (queue) {
			queue.songs.length = 0;
		}
		if (int.type === InteractionType.MessageComponent) {
			npMessage({interaction: int})
		} else if (int.type === MessageType.Default){
			npMessage({message: int});
		}
		// I dont think this is needed at the moment. 
		// if (int.type === InteractionType.MessageComponent) {
		// 	let content = int.message.content;
		// 	let embeds = int.message.embeds;
		// 	let buttons = makeButtons(false);
		// 	npmessage.edit({content, embeds, components:[buttons]});
		// } else if (int?.type === MessageType.Default) {
		// 	let content = int.content;
		// 	let embeds = int.embeds;
		// 	let buttons = makeButtons(false);
		// 	npmessage.edit({content, embeds, components:[buttons]})
		// }
	}

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
			i.client.queue.delete(GUILDID);
		}
	});

	player.on(AudioPlayerStatus.Idle, async (): Promise<void> => {
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
			const timeout = setTimeout(() => {
				if (queue === undefined) {
					reply({ interaction, content: i18n.__('queue.errorNotQueue'), ephemeral: true });
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
				i.client.queue.delete(i.guildId!);
				connection?.removeAllListeners();
				connection?.destroy();
				followUp({
					message,
					interaction,
					content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
					ephemeral: false,
				});
				return;
			}, STAY_TIME * 1_000);

			// // If there is no queue then there was a werid error
			if (!queue) {
				clearTimeout(timeout);
				npMessage({ message, interaction });
				// TODO possibly more things to kill?
				connection.destroy();
				player.stop();
				return;
			}
			queue.timeout = timeout;

			if (queue.songs.length > 1 && !queue?.loop) {
				clearTimeout(timeout);
				// songs in queue and queue not looped so play next song
				queue.songs.shift();
				play({
					song: queue.songs[0],
					message,
					interaction,
				});
			} else if (queue.songs.length >= 1 && queue.loop) {
				clearTimeout(timeout);
				// at least one song in queue and queue is looped so push finished
				// song to back of queue then play next song
				let lastSong = queue.songs.shift();
				
				if (!lastSong) throw new Error('Cannot shift songs. Looping failed');

				queue.songs.push(lastSong);
				play({
					song: queue.songs[0],
					message,
					interaction,
				});
			} else if (queue.songs.length === 1 && !queue.loop) {
				clearTimeout(timeout);
				// If there are no more songs in the queue then wait for STAY_TIME before leaving vc
				// unless a song was added during the timeout
				npMessage({ message, interaction });
				queue.songs.shift();
				setTimeout(() => {
					if (queue === undefined) {
						reply({ interaction, content: i18n.__('queue.errorNotQueue'), ephemeral: true });
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
					followUp({
						message,
						interaction,
						content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
						ephemeral: false,
					});
					return i.client.queue.delete(GUILDID);
				}, STAY_TIME * 1_000);
			}
			// must remove these listeners before we call play function again to avoid memory leak and maxListeners exceeded error
			connection?.removeAllListeners();

			// stop for same reason as connection above
			if (collector && !collector.ended) {
				collector.stop('idleQueue');
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
					queueEnd(i, npmessage);
					player.stop();
				}
			} finally {
				followUp({
					message,
					interaction,
					content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
					ephemeral: false,
				});
				i.client.queue.delete(GUILDID);
				npMessage({ message, interaction });
			}
		}
	});
	i.client.on('voiceStateUpdate', (oldState, newState) => {
		if (queue === undefined) {
			reply({ interaction, content: i18n.__('queue.errorNotQueue'), ephemeral: true });
			return;
		}
		if (oldState === null || newState === null) return;
		if (newState.member!.user.bot) return;
		if (oldState.channelId === queue.connection.joinConfig.channelId && !newState.channelId) {
			setTimeout(() => {
				if (oldState.channel!.members.size > 1) return;
				i.client.queue.delete(GUILDID);
				queueEnd(i, npmessage);
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
}
