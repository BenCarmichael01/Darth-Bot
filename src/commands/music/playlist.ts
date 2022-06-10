/* global __base */
import { play } from '../../include/play';
import { npMessage } from '../../include/npmessage';
import i18n from 'i18n';
import * as voice from '@discordjs/voice';
import * as discordjs from 'discord.js';
import playdl, { SpotifyTrack } from 'play-dl';
import YouTubeAPI from 'simple-youtube-api';
import he from 'he';

const { MAX_PLAYLIST_SIZE, DEFAULT_VOLUME, LOCALE } = require(`${__base}/include/utils`);
import { reply, followUp } from '../../include/responses';
import { APIMessage } from 'discord-api-types/v9';
import { IQueue, Isong } from 'src/types';

// i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(process.env.YOUTUBE_API_KEY);

module.exports = {
	name: 'playlist',
	category: 'music',
	description: i18n.__('playlist.description'),
	guildOnly: 'true',
	slash: true,
	options: [
		{
			name: 'music',
			description: i18n.__('play.option'),
			type: 'STRING',
			required: true,
		},
	],
	async callback({
		message,
		interaction,
		args,
	}: {
		message?: discordjs.Message;
		interaction: discordjs.CommandInteraction;
		args: Array<any>;
	}) {
		var i;
		if (interaction) {
			i = interaction;
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ ephemeral: true });
			}
		} else if (message) {
			i = message;
		} else return;

		if (!i.guild) return; // TODO return error message here and above ^^

		const settings = i.client.db.get(i.guild.id);

		if (settings === undefined || !settings.musicChannel) {
			// const channelExists = await i.guild.channels.fetch(settings.musicChannel);
			reply({ message, interaction, content: i18n.__('common.noSetup'), ephemeral: true });
			message?.delete();
			return;
		}
		const member = i.member as discordjs.GuildMember;
		if (member.voice) {
			var { channel } = member.voice;
		} else return; // TODO return error message

		const serverQueue = i.client.queue.get(i.guild.id);
		if (!channel) {
			reply({
				message,
				interaction,
				content: i18n.__('playlist.errorNotChannel'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		if (i.guild.me) {
			var permissions = channel.permissionsFor(i.guild.me);
		} else return; // TODO return error message
		if (!permissions.has('CONNECT')) {
			reply({
				message,
				interaction,
				content: i18n.__('playlist.missingPermissionConnect'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		if (!permissions.has('SPEAK')) {
			reply({
				message,
				interaction,
				content: i18n.__('missingPermissionSpeak'),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		if (serverQueue && channel !== i.guild.me.voice.channel) {
			reply({
				message,
				interaction,
				content: i18n.__mf('play.errorNotInSameChannel', {
					user: i.client.user!.id,
				}),
				ephemeral: true,
			});
			message?.delete();
			return;
		}
		// TODO remove nullish coalessence and check process.env for vars
		await playdl.setToken({
			spotify: {
				client_id: process.env.SPOTIFY_CLIENT!,
				client_secret: process.env.SPOTIFY_SECRET!,
				refresh_token: process.env.SPOTIFY_REFRESH!,
				market: process.env.SPOTIFY_MARKET!,
			},
		});

		if (playdl.is_expired()) {
			await playdl.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
		}

		const url = args[0];
		const isSpotify = playdl.sp_validate(url);
		const isYt = playdl.yt_validate(url);

		const queueConstruct: IQueue = {
			textChannel: i.channel,
			channel,
			connection: null,
			player: null,
			songs: [],
			loop: false,
			playing: true,
		};

		var searching: discordjs.Message;
		if (message) {
			searching = await message.reply(i18n.__('playlist.searching'));
		} else if (interaction) {
			searching = (await interaction.editReply({
				content: i18n.__('playlist.searching'),
			})) as discordjs.Message;
		} else return; // TODO return error message

		if (message) {
			message.delete();
		}

		var videos: Isong[] = [];
		var playlistTitle: string;
		if (isYt === 'playlist') {
			try {
				let playlist = await playdl.playlist_info(url, { incomplete: true });
				if (!playlist.title) return;
				playlistTitle = playlist.title;
				await playlist.fetch(MAX_PLAYLIST_SIZE);
				const vidInfo = playlist.page(1);
				vidInfo.slice(0, MAX_PLAYLIST_SIZE + 1).forEach((video) => {
					if (!video.title) return;
					let song = {
						title: he.decode(video.title),
						url: video.url,
						thumbUrl: video.thumbnails[video.thumbnails.length - 1].url,
						duration: video.durationInSec,
					};
					videos.push(song);
				});
				if (message) {
					searching.delete().catch(console.error);
				}
			} catch (error) {
				console.error(error);
				if (message) {
					searching.delete().catch(console.error);
				}
				return reply({
					message,
					interaction,
					content: i18n.__('playlist.errorNotFoundPlaylist'),
					ephemeral: true,
				});
			}
		} else if (isSpotify === 'playlist' || isSpotify === 'album') {
			try {
				let playlist = await playdl.spotify(url);
				if ('fetch' in playlist) {
					await playlist.fetch();
				}
				playlistTitle = playlist.name;
				if ('page' in playlist) {
					var tracks = playlist.page(1)!;
				} else return; // TODO return error message

				if (tracks.length > MAX_PLAYLIST_SIZE) {
					reply({
						message,
						interaction,
						content: i18n.__mf('playlist.maxSize', { maxSize: MAX_PLAYLIST_SIZE }),
						ephemeral: true,
					});
				}
				for (let i = 0; i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 20) && i < tracks.length; i++) {
					let search = tracks[i].name + ' ' + tracks[i].artists[0].name;
					const results = await youtube.searchVideos(search, 1, {
						part: 'snippet.title, snippet.maxRes, snippet.durationSeconds',
					});
					const searchResult = results[0];
					if (!searchResult) continue;
					let song = {
						title: he.decode(searchResult?.title),
						url: searchResult?.url,
						thumbUrl: searchResult?.maxRes.url,
						duration: searchResult?.durationInSec,
					};
					videos.push(song);
				}
				if (message) {
					searching.delete().catch(console.error);
				}
			} catch (error: any) {
				console.error(error);
				if (message) {
					searching.delete().catch(console.error);
				}
				return reply({ message, interaction, content: error.message, ephemeral: true });
			}
		} else {
			if (message) {
				searching.delete().catch(console.error);
			}
			reply({ message, interaction, content: i18n.__('playlist.notPlaylist'), ephemeral: true });
			return;
		}
		// else {
		// 	try {
		// 		let [playlist] = await playdl.search(search, {
		// 			source: { youtube: 'playlist' },
		// 			limit: 1,
		// 		});
		// 		await playlist.all_videos();
		// 		for (
		// 			let i = 0;
		// 			i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) && i < playlist.videos.length;
		// 			i++
		// 		) {
		// 			let video = playlist.videos[i];
		// 			let song = {
		// 				title: video.title,
		// 				url: video.url,
		// 				thumbUrl: video.thumbnails[search.thumbnails.length - 1].url,
		// 				duration: video.durationInSec,
		// 			};
		// 			videos.push(song);
		// 		}
		// 		if (message) {
		// 			searching.delete().catch(console.error);
		// 		}
		// 	} catch (error) {
		// 		if (message) {
		// 			searching.delete().catch(console.error);
		// 		}
		// 		console.error(error);
		// 		return reply({ message, interaction, content: error.message, ephemeral: true });
		// 	}
		// }
		if (serverQueue) {
			serverQueue.songs.push(...videos);
			npMessage({ message, interaction, npSong: serverQueue.songs[0] });
			followUp({
				message,
				interaction,
				content: i18n.__mf('playlist.queueAdded', {
					playlist: playlistTitle,
					author: member.id,
				}),
				ephemeral: false,
			});
		} else {
			queueConstruct.songs.push(...videos);
		}
		if (!serverQueue) {
			i.client.queue.set(i.guild.id, queueConstruct);

			try {
				if (!voice.getVoiceConnection(i.guild.id)) {
					queueConstruct.connection = voice.joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guildId,
						selfDeaf: true,
						adapterCreator: channel.guild
							.voiceAdapterCreator as voice.DiscordGatewayAdapterCreator,
						// TODO this is a temp workaround. discord js github issue #7273:
						// https://github.com/discordjs/discord.js/issues/7273
						// will be fixed in v14 not v13
					});
				}
				followUp({
					message,
					interaction,
					content: i18n.__mf('playlist.queueAdded', {
						playlist: playlistTitle,
						author: member.id,
					}),
					ephemeral: false,
				});
				play({ song: queueConstruct.songs[0], message, interaction });
			} catch (error) {
				console.error(error);
				i.client.queue.delete(i.guild.id);
				await queueConstruct.connection.destroy();
				return followUp({
					message,
					interaction,
					content: i18n.__mf('play.cantJoinChannel', { error }),
					ephemeral: true,
				});
			}
		}
		// TODO this used to return 1 but i cant remember why so i've removed it
		// return;
	},
};
