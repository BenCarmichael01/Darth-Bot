/* global __base */
import { play } from '../../include/play';
import YouTubeAPI from 'simple-youtube-api';
import playdl, { SpotifyTrack } from 'play-dl';
import i18n from 'i18n';
import * as voice from '@discordjs/voice';
import he from 'he';

import { npMessage } from '../../include/npmessage';
import { YOUTUBE_API_KEY, LOCALE, MSGTIMEOUT, TESTING } from '../../include/utils';
import { reply, followUp } from '../../include/responses';
import { IQueue, Isong } from '../../types/types';
import { 
	ChannelType,
	ChatInputCommandInteraction,
	Guild,
	GuildMember,
	Message,
	PermissionFlagsBits,
	SlashCommandBuilder,
	VoiceBasedChannel,
} from 'discord.js';

if (LOCALE) i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
	data: new SlashCommandBuilder()
				.setName('play')
				.setDescription(i18n.__('play.description'))
				.addStringOption(option => 
					option.setName('music')
					.setDescription(i18n.__('play.description'))
					.setRequired(true)
				),
	async execute(interaction: ChatInputCommandInteraction) {
		interaction.deferReply({ephemeral: true});
		// if (interaction) {
		// 	if (!interaction.deferred && !interaction.replied) {
		// 		await interaction.deferReply({ ephemeral: true });
		// 	}
		// 	i = interaction;
		// 	// i.isInteraction = true;
		// } else if (message) {
		// 	i = message;
		// 	// i.isInteraction = false;
		// }
		// if (!i) return;

		// if (!i?.guildId) return;
		const db = await interaction.client.db.findOne({where: {id: interaction.guildId!}});
		if (!db) {
			await interaction.editReply({
				content: i18n.__('common.noSetup'),
			});
			return;
		}
		const musicChannelId = db.get('musicChannel');
		if (!musicChannelId) {
			await interaction.editReply({
				content: i18n.__('common.noSetup'),
			});
			return;
		};

		const musicChannel = await interaction.guild!.channels.fetch(musicChannelId);

		if (!musicChannel) {
			await interaction.editReply({
				content: i18n.__('common.noSetup'),
			});
			return;
		}

		if (musicChannel.type !== ChannelType.GuildText) {
			throw new Error('Music Channel in database isn\'t of type \'guildText\'.')
		};
	
		const { member, guild } = interaction;
		
		if (!(guild instanceof Guild)) {
			interaction.editReply({
				 content: 'Cannot read guild from interaction.\nPlease contact my author!',
				});
				return;
		}

		const serverQueue = interaction.client.queue.get(guild.id);
		let userVc: VoiceBasedChannel;
		let botVoiceChannel: VoiceBasedChannel|null;

		if ((member instanceof GuildMember) && member.voice.channel) {
			userVc = member.voice.channel;
		} else {
			interaction.editReply({
				content: i18n.__('play.errorNotChannel'),
			});
			return;
		}

		if (guild.members.me?.voice.channel) {
			botVoiceChannel = guild.members.me.voice.channel;

		} else {
			botVoiceChannel = null;
		}

		if (serverQueue && userVc !== botVoiceChannel) {
			interaction.editReply({
				content: i18n.__mf('play.errorNotInSameChannel', {
					user: interaction.client.user,
				}),
			});
			return;
		}

		// Not needed if slash cmd option is set to required.
		// We will always receive interaction.options
		// 
		// if (!args.length) {
		// 	reply({
		// 		message,
		// 		interaction,
		// 		// TODO remove prefix references
		// 		content: i18n.__mf('play.usageReply', { prefix }),
		// 		ephemeral: true,
		// 	});
		// 	message?.delete();
		// 	return;
		// }

		const permissions = userVc.permissionsFor(interaction.client.user);
		if (!permissions) {
			interaction.editReply({
				content: i18n.__('play.permsNotFound'),
			});
			return;
		}
		if (!permissions.has(PermissionFlagsBits.Connect)) {
			interaction.editReply({
				content: i18n.__('play.missingPermissionConnect'),
			});
			return;
		}
		if (!permissions.has(PermissionFlagsBits.Speak)) {
			interaction.editReply({
				content: i18n.__('play.missingPermissionSpeak'),
			});
			return;
		}
		if (
			process.env.SPOTIFY_CLIENT &&
			process.env.SPOTIFY_SECRET &&
			process.env.SPOTIFY_REFRESH &&
			process.env.SPOTIFY_MARKET
		) {
			await playdl.setToken({
				spotify: {
					client_id: process.env.SPOTIFY_CLIENT,
					client_secret: process.env.SPOTIFY_SECRET,
					refresh_token: process.env.SPOTIFY_REFRESH,
					market: process.env.SPOTIFY_MARKET,
				},
			});
		} else {
			interaction.editReply({
				content: i18n.__('play.missingSpot'),
			});
		}

		if (playdl.is_expired()) {
			await playdl.refreshToken(); // This will check if access token has expired. If yes, then refresh the token.
		}

		if (serverQueue?.timeout) {
			clearTimeout(serverQueue.timeout);
		}

		const music = interaction.options.getString('music');
		if (!music) throw new Error('Unable to read requested song: getString() failed');

		const isSpotify = playdl.sp_validate(music);
		const isYt = playdl.yt_validate(music);

		// Fix below ref to playlist command
		//  Start the playlist if playlist url was provided
		// if (isYt === 'playlist') {
		// 	instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
		// 	return;
		// }
		// if (isSpotify === 'playlist' || isSpotify === 'album') {
		// 	instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
		// 	return;
		// }

		let songInfo:any; //TODO make type 
		let song:Isong;

		if (isYt === 'video' && music.startsWith('https')) {
			try {
				songInfo = await youtube.getVideo(music, { part: 'snippet' });
				if (songInfo) {
					song = {
						title: he.decode(songInfo.title),
						url: songInfo.url,
						thumbUrl: songInfo.maxRes.url,
						duration: songInfo.durationSeconds,
					};
				} else {
					throw new Error('Search failed. Unable to get song info from youtube');
				};
			} catch (error) {
				if (!(error instanceof Error)) return;
				console.error(error);
				interaction.followUp({
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
					ephemeral: false,
				});
				return;
			}
		} else if (isSpotify === 'track') {
			try {
				const spot = (await playdl.spotify(music)) as SpotifyTrack;
				if (spot.type === 'track') {
					let search = spot.name + ' ' + spot.artists[0].name;
					const results = await youtube.searchVideos(search, 1, {
						part: 'snippet',
					});
					const searchResult = results[0];
					song = {
						title: he.decode(searchResult.title),
						url: searchResult.url,
						thumbUrl: searchResult.maxRes.url,
						duration: searchResult.durationSeconds,
					};
				} else {
					throw new Error('Cannot read type of Spotify.');
				};
			} catch (error) {
				if (!(error instanceof Error)) return;
				console.error(error);
				interaction.followUp({
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
					ephemeral: false,
				});
				return;
			}
		} else {
			try {
				const results = await youtube.searchVideos(music, 1, { part: 'snippet' });

				if (results) {
					const searchResult = results[0];
					song = {
						title: he.decode(searchResult.title),
						url: searchResult.url,
						thumbUrl: searchResult.maxRes.url,
						duration: searchResult.durationSeconds,
					};
				} else {
					throw new Error('Youtube search failed');
				};
			} catch (error) {
				console.error(error);
				if (!(error instanceof Error)) return;
				interaction.followUp({
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
						ephemeral: false,
					}),
					ephemeral: false,
				});
				return;
			}
		}
		if (!song) {
			interaction.editReply({
				content: i18n.__('play.songError'),
			});
			return;
		}


	if (serverQueue) {
	if (serverQueue.songs.length === 0) {
		serverQueue.songs.push(song);
		play({
			song: serverQueue.songs[0],
			interaction,
		});
		await songAdded(interaction, serverQueue, song);
		return;
	} else {
		serverQueue.songs.push(song);
		await songAdded(interaction, serverQueue, song);
	}
	}

	try {
	const connection = voice.getVoiceConnection(guild.id!);
	if (!connection) {
		var newConnection = voice.joinVoiceChannel({
			channelId: userVc.id,
			guildId: userVc.guildId,
			selfDeaf: true,
			adapterCreator: userVc.guild.voiceAdapterCreator as voice.DiscordGatewayAdapterCreator,
			// TODO this is a temp workaround. discord js github issue #7273:
			// https://github.com/discordjs/discord.js/issues/7273
			// will be fixed in v14 not v13
		});
	} else {
		newConnection = connection;
	}
	const queueConstruct: IQueue = {
		textChannel: musicChannel,
		collector: null,
		voiceChannel: userVc,
		connection: newConnection,
		player: null,
		timeout: null,
		songs: [song],
		loop: false,
		playing: true,
	};

	interaction.client.queue.set(guild.id, queueConstruct);
	play({
		song: queueConstruct.songs[0],
		interaction,
	});
	await interaction.editReply({
		content: i18n.__('play.success'),
	});

	queueConstruct.textChannel
		.send({
			content: i18n.__mf('play.queueAdded', {
				title: queueConstruct.songs[0].title,
				author: member.id,
			}),
		})
		.then((msg: Message) => {
			setTimeout(() => {
				msg.delete().catch(console.error);
			}, MSGTIMEOUT as number);
		})
		.catch(console.error);
	} catch (error) {
		if (!(error instanceof Error)) return;

		console.error(error);
		interaction.client.queue.delete(guild.id);
		let pcon = voice.getVoiceConnection(guild.id!);
		pcon?.destroy();

		interaction.followUp({
			content: i18n.__('play.cantJoinChannel', {
				error: error.message,
			}),
			ephemeral: true,
		});
	};

}
}
async function songAdded(
	//message: Message | undefined,
	interaction: ChatInputCommandInteraction,
	serverQueue: IQueue,
	song: Isong) {
	if (!interaction || !(interaction.member instanceof GuildMember)) return; 

	npMessage({
		interaction,
		npSong: serverQueue.songs[0],
	});
	await interaction.editReply({
		content: i18n.__('play.success'),
	});

	serverQueue.textChannel
		.send(
			i18n.__mf('play.queueAdded', {
				title: song!.title,
				author: !interaction.member.id,
			}),
		)
		.then((msg: Message) => {
			setTimeout(() => msg.delete(), MSGTIMEOUT);
		})
		.catch(console.error);
};