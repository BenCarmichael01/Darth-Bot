/* global __base */
import playdl, { YouTubeStream } from 'play-dl';
import { npMessage } from './npmessage';
import { canModifyQueue, STAY_TIME, LOCALE, MSGTIMEOUT } from '../include/utils';
import { followUp, reply } from './responses';
import i18n from 'i18n';
import * as voice from '@discordjs/voice';
import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	Guild,
	GuildMember,
	Message,
	PermissionFlagsBits,
} from 'discord.js';
import '../types/types';
import { CustomConnection, CustomPlayer, IQueue, playArgs } from '../types/types';
import makeButtons from './makebuttons';
import { shuffle } from '../include/shuffle';

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
	if (playdl.yt_validate(song.url)) {
		try {
			source = await playdl.stream(song.url, {
				discordPlayerCompatibility: false,
			});
			if (!source) throw new Error('No stream found');
		} catch (error) {
			console.error(error);
			return Promise.reject('Failed to create audio resource');
		}
	} else return Promise.reject('\'Url\' is not a Youtube URL\nFailed to create audio resource');
	const resource = voice.createAudioResource(source.stream, {
		inputType: source.type,
	});
	return resource;
}

function queueEnd(interaction: ChatInputCommandInteraction | ButtonInteraction, npmessage: Message) {
	let queue = interaction.client.queue.get(interaction.guildId!);
	if (queue) {
		queue.songs.length = 0;
	}
	npMessage({interaction});
	// if (interaction.type === InteractionType.MessageComponent) {
	// 	npMessage({interaction: interaction})
	// } else if (interaction.type === MessageType.Default){
	// 	npMessage({message: interaction});
	// }
	
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

export async function play({ song, interaction }: playArgs): Promise<any> {
	if (!interaction.deferred && !interaction.replied) {
		await interaction.deferReply({ ephemeral: false });
	}
	
	const GUILDID = interaction.guildId as string;

	var queue = interaction.client.queue.get(GUILDID);
	const currentConnection = voice.getVoiceConnection(GUILDID) as CustomConnection & voice.VoiceConnection;
	const { VoiceConnectionStatus, AudioPlayerStatus } = voice;

	if (queue === undefined) return;
	if (!currentConnection) return;

	let attempts = 0;
	let resource:voice.AudioResource | void | undefined;
	
	while (!(queue?.songs.length < 1 || attempts >= 5)) {
		resource = await getResource(queue).catch((reason)=>console.error(reason));
		if (resource) {
			break;
		} else {
			attempts++;
			queue.songs.shift();
			interaction.followUp({
				content: i18n.__mf('play.queueError'),
				ephemeral: true,
			});
			resource=undefined;
		}
	}
	if (resource === undefined) {
		interaction.followUp({
			content: i18n.__mf('play.queueFail'),
			ephemeral: true,
		});
		return;
	}
	const player = voice.createAudioPlayer({
		behaviors: { noSubscriber: voice.NoSubscriberBehavior.Pause },
	}) as CustomPlayer & voice.AudioPlayer;

	/*-----------------Event Listeners-------------------------*/
	player.on('error', (error: voice.AudioPlayerError) => {
		console.error(`Error: ${error.message} with resource`);
	});

	player.on('stateChange', (oldState, newState) => {
		console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
	});

	currentConnection.on('stateChange', (oldState, newState) => {
		console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
	});
	// pass stream to audio player
	try {
		player.play(resource);
	} catch (error) {
		console.error(error);
		return;
	}
	currentConnection.subscribe(player);

	// vvv Do not remove comma!! it is to skip the first item in the array
	const { npmessage, collector } = await npMessage({
		interaction,
		npSong: song,
	});
	if (npmessage === undefined || npmessage === null) {
		return interaction.followUp({ content: i18n.__('common.unknownError'), ephemeral: true });
	}
	if (collector === undefined || collector === null) {
		return interaction.followUp({ content: i18n.__('common.unknownError'), ephemeral: true });
	}
	queue.player = player;
	queue.collector = collector;

	interaction.client.queue.set(interaction.guildId!, queue);

	collector.on('collect', async (interaction: ButtonInteraction) => {
		if (!interaction) return;
		const member = interaction.member;

		if (!member || !(member instanceof GuildMember)) return; // TODO error handling

		const name = member.id;
		const queue = interaction.client.queue.get(interaction.guild!.id);

		// is below needed? if there is no queue then this collector should have already been destroyed
		if (queue === undefined) {
			interaction.followUp({ content: i18n.__('queue.errorNotQueue'), ephemeral: true });
			return;
		}
		switch (interaction.customId) {
			case 'playpause': {
				interaction.deferReply();
				if (!canModifyQueue(member)) {
					return interaction
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
					interaction.editReply({
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
					interaction.editReply({
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
				interaction.deferReply({ephemeral: true})
				if (!canModifyQueue(member)) {
					return interaction
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
				interaction.editReply({
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
				currentConnection.removeAllListeners();
				player.removeAllListeners();
				player.stop();
				if (queue.songs.length > 0) {
					play({
						song: queue.songs[0],
						interaction: interaction,
					});
				} else {
					npMessage({
						interaction: interaction,
					});
				}
				break;
			}
			case 'loop': {
				interaction.deferReply();
				if (!canModifyQueue(member)) {
					return interaction
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
				if (interaction.message.components !== null && interaction.message.components !== undefined) {
					queue.loop = !queue.loop;
					if (!(interaction.guild instanceof Guild)) return;
					interaction.client.queue.set(interaction.guild.id, queue);
					let content = interaction.message.content;
					let embeds = interaction.message.embeds;

					if (queue.loop) {
						let buttons = makeButtons(true);
						interaction.update({ content, embeds, components: [buttons]
						}).catch(console.error);
					} else {
						let buttons = makeButtons(false);
						interaction.update({ content, embeds, components: [buttons]
						}).catch(console.error);
					}
				}
				break;
			}
			case 'shuffle': {
				await interaction.deferReply();
				shuffle(interaction);
				break;
			}
			case 'stop': {
				interaction.deferReply();
				let perms = member.permissions;
				if (!perms.has(PermissionFlagsBits.Administrator) && !canModifyQueue(member)) {
					return interaction
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
				interaction.editReply({
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
					queueEnd(interaction, npmessage);
					npMessage({ interaction: interaction });
					player.stop();
					collector.stop();
				} catch (error) {
					console.error(error);
					if (currentConnection?.state?.status !== VoiceConnectionStatus.Destroyed) {
						currentConnection.destroy();
					}
				}
				break;
			}
		}
	});

	
	// Check if disconnect is real or is moving to another channel
	currentConnection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				voice.entersState(currentConnection, VoiceConnectionStatus.Signalling, 5_000),
				voice.entersState(currentConnection, VoiceConnectionStatus.Connecting, 5_000),
			]);
			// Seems to be reconnecting to a new channel - ignore disconnect
		} catch (error) {
			// Seems to be a real disconnect which SHOULDN'T be recovered from
			if (currentConnection?.state?.status !== VoiceConnectionStatus.Destroyed) {
				currentConnection.destroy();
			}
			interaction.client.queue.delete(GUILDID);
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
			console.error(error);
			const timeout = setTimeout(() => {
				if (queue === undefined) {
					reply({ interaction, content: i18n.__('queue.errorNotQueue'), ephemeral: true });
					return;
				}
				if (queue.songs.length >= 1) {
					play({
						song: queue.songs[0],
						interaction,
					});
					return;
				}
				queueEnd(interaction, npmessage);
				player.removeAllListeners();
				interaction.client.queue.delete(interaction.guildId!);
				currentConnection?.removeAllListeners();
				currentConnection?.destroy();
				interaction.followUp({
					content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
					ephemeral: false,
				});
				return;
			}, STAY_TIME * 1_000);

			// // If there is no queue then there was a werid error
			if (!queue) {
				clearTimeout(timeout);
				npMessage({ interaction });
				// TODO possibly more things to kill?
				currentConnection.destroy();
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
					interaction,
				});
			} else if (queue.songs.length === 1 && !queue.loop) {
				clearTimeout(timeout);
				// If there are no more songs in the queue then wait for STAY_TIME before leaving vc
				// unless a song was added during the timeout
				npMessage({ interaction });
				queue.songs.shift();
				setTimeout(() => {
					if (queue === undefined) {
						reply({ interaction, content: i18n.__('queue.errorNotQueue'), ephemeral: true });
						return;
					}
					if (queue.songs.length >= 1) {
						play({
							song: queue.songs[0],
							interaction,
						});
						return;
					}
					queueEnd(interaction, npmessage);
					currentConnection?.destroy();
					interaction.followUp({
						content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
						ephemeral: false,
					});
					return interaction.client.queue.delete(GUILDID);
				}, STAY_TIME * 1_000);
			}
			// must remove these listeners before we call play function again to avoid memory leak and maxListeners exceeded error
			currentConnection?.removeAllListeners();

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
			console.error(error);
			try {
				if (currentConnection?.state?.status !== VoiceConnectionStatus.Destroyed) {
					currentConnection.destroy();
					//throw new Error('Test Error');
				}
				if (player) {
					queueEnd(interaction, npmessage);
					player.stop();
				}
			} finally {
				interaction.followUp({
					content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
					ephemeral: false,
				});
				interaction.client.queue.delete(GUILDID);
				npMessage({ interaction });
			}
		}
	});

	interaction.client.on('voiceStateUpdate', (oldState, newState) => {
		if (queue === undefined) {
			reply({ interaction, content: i18n.__('queue.errorNotQueue'), ephemeral: true });
			return;
		}
		if (oldState === null || newState === null) return;
		if (oldState === newState) return;
		if (newState.member!.user.bot) return;
		if (oldState.channelId === queue.connection.joinConfig.channelId && !newState.channelId) {
			setTimeout(() => {
				if (oldState.channel!.members.size > 1) return;
				interaction.client.queue.delete(GUILDID);
				queueEnd(interaction, npmessage);
				player.removeAllListeners();
				player.stop();
				currentConnection?.destroy();
				npMessage({ interaction });
				interaction.followUp({
					content: i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
					ephemeral: false,
				});
				return;
			}, STAY_TIME * 1_000);
		}
	});
}
