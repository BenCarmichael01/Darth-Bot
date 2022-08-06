/* global __base */
import { play } from '../../include/play';
import YouTubeAPI from 'simple-youtube-api';
import playdl, { SpotifyTrack } from 'play-dl';
import i18n from 'i18n';
import * as voice from '@discordjs/voice';
import he from 'he';
import * as discordjs from 'discord.js';

import { npMessage } from '../../include/npmessage';
import { YOUTUBE_API_KEY, LOCALE, MSGTIMEOUT } from '../../include/utils';
import { reply, followUp } from '../../include/responses';
import { IQueue, playCmdArgs } from 'src/types';
import { ICommand } from 'wokcommands';

if (LOCALE) i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

export default {
	name: 'play',
	category: 'music',
	description: i18n.__('play.description'),
	guildOnly: true,
	slash: true,
	testOnly: true,
	options: [
		{
			name: 'music',
			description: i18n.__('play.option'),
			type: 'STRING',
			required: true,
		},
	],

	async callback(options: playCmdArgs) {
		const { message, interaction, args, prefix, instance } = options;
		let i;
		if (interaction) {
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ ephemeral: true });
			}
			i = interaction;
			// i.isInteraction = true;
		} else if (message) {
			i = message;
			// i.isInteraction = false;
		}
		if (!i) return;

		// if (!i?.guildId) return;
		const settings = i.client.db.get(i.guildId!);
		if (!settings) {
			await reply({
				message,
				interaction,
				content: i18n.__('common.noSetup'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}

		const musicChannel = await i.guild!.channels.fetch(settings.musicChannel);

		if (!settings?.musicChannel || !musicChannel) {
			await reply({
				message,
				interaction,
				content: i18n.__('common.noSetup'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		const member = i.member as discordjs.GuildMember;
		const guild = i.guild as discordjs.Guild;
		const userVc = member.voice.channel;
		const botVoiceChannel = guild.me!.voice.channel;
		const serverQueue = i.client.queue.get(guild.id);

		if (!userVc) {
			reply({
				message,
				interaction,
				content: i18n.__('play.errorNotChannel'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		if (serverQueue && userVc !== botVoiceChannel) {
			reply({
				message,
				interaction,
				content: i18n.__mf('play.errorNotInSameChannel', {
					user: i.client.user,
				}),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		if (!args.length) {
			reply({
				message,
				interaction,
				content: i18n.__mf('play.usageReply', { prefix }),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		const permissions = userVc.permissionsFor(i.client.user as discordjs.ClientUser);
		if (!permissions) {
			reply({
				message,
				interaction,
				content: i18n.__('play.permsNotFound'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		if (!permissions.has('CONNECT')) {
			reply({
				message,
				interaction,
				content: i18n.__('play.missingPermissionConnect'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		if (!permissions.has('SPEAK')) {
			reply({
				message,
				interaction,
				content: i18n.__('play.missingPermissionSpeak'),
				ephemeral: true,
			});
			message?.delete();
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
			reply({
				interaction,
				message,
				content: i18n.__('play.missingSpot'),
				ephemeral: true,
			});
		}

		if (playdl.is_expired()) {
			await playdl.refreshToken(); // This will check if access token has expired. If yes, then refresh the token.
		}

		if (serverQueue?.timeout) {
			clearTimeout(serverQueue.timeout);
		}
		const search = args.join(' ');
		const url = args[0];
		const isSpotify = playdl.sp_validate(url);
		const isYt = playdl.yt_validate(url);

		//  Start the playlist if playlist url was provided
		if (isYt === 'playlist') {
			instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
			return;
		}
		if (isSpotify === 'playlist' || isSpotify === 'album') {
			instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
			return;
		}

		let songInfo = null;
		let song = null;

		if (isYt === 'video' && url.startsWith('https')) {
			try {
				songInfo = await youtube.getVideo(url, { part: 'snippet' });
				song = {
					title: he.decode(songInfo.title),
					url: songInfo.url,
					thumbUrl: songInfo.maxRes.url,
					duration: songInfo.durationSeconds,
				};
			} catch (error) {
				if (!(error instanceof Error)) return;
				console.error(error);
				followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
					ephemeral: false,
				});
				return;
			}
		} else if (isSpotify === 'track') {
			try {
				const spot = (await playdl.spotify(url)) as SpotifyTrack;
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
				}
			} catch (error) {
				if (!(error instanceof Error)) return;
				console.error(error);
				followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
					ephemeral: false,
				});
				return;
			}
		} else {
			try {
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
			} catch (error) {
				if (!(error instanceof Error)) return;
				console.error(error);
				followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
						ephemeral: false,
					}),
					ephemeral: false,
				});
				message ? message.delete() : null;
				return;
			}
		}
		if (!song) {
			reply({
				message,
				interaction,
				content: i18n.__('play.songError'),
				ephemeral: true,
			});
			return;
		}

		if (serverQueue && serverQueue.songs.length > 0) {
			serverQueue.songs.push(song);
			npMessage({
				interaction,
				message,
				npSong: serverQueue.songs[0],
			});
			await reply({
				message,
				interaction,
				content: i18n.__('play.success'),
				ephemeral: true,
			});
			message ? message.delete() : null;
			serverQueue.textChannel
				.send(
					i18n.__mf('play.queueAdded', {
						title: song!.title,
						author: member.id,
					}),
				)
				.then((msg: discordjs.Message) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT as number);
				})
				.catch(console.error);
			return;
		}

		// queueConstruct.songs.push(song);
		try {
			if (!voice.getVoiceConnection(guild.id!)) {
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
				throw Error;
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

			i.client.queue.set(i.guildId!, queueConstruct);
			play({
				song: queueConstruct.songs[0],
				message,
				interaction,
			});
			await reply({
				message,
				interaction,
				content: i18n.__('play.success'),
				ephemeral: true,
			});
			message ? message.delete() : null;
			queueConstruct.textChannel
				.send({
					content: i18n.__mf('play.queueAdded', {
						title: queueConstruct.songs[0].title,
						author: member.id,
					}),
				})
				.then((msg: discordjs.Message) => {
					setTimeout(() => {
						msg.delete().catch(console.error);
					}, MSGTIMEOUT as number);
				})
				.catch(console.error);
		} catch (error) {
			if (!(error instanceof Error)) return;
			console.error(error);
			i.client.queue.delete(guild.id);
			let pcon = voice.getVoiceConnection(guild.id!);
			pcon?.destroy();

			followUp({
				message,
				interaction,
				content: i18n.__('play.cantJoinChannel', {
					error: error.message,
				}),
				ephemeral: true,
			});
			message ? message.delete() : null;
			return;
		}

		return;
	},
} as ICommand;
