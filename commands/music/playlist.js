/* global __base */
const { play } = require(`${__base}include/play`);
const { npMessage } = require(`${__base}include/npmessage`);
const i18n = require('i18n');
const voice = require('@discordjs/voice');
const playdl = require('play-dl');
const YouTubeAPI = require('simple-youtube-api');

const { MAX_PLAYLIST_SIZE, DEFAULT_VOLUME, LOCALE } = require(`${__base}/include/utils`);
const { reply, followUp } = require('../../include/responses');

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(process.env.YOUTUBE_API_KEY);

module.exports = {
	name: 'playlist',
	category: 'music',
	description: i18n.__('playlist.description'),
	guildOnly: 'true',
	testOnly: true,
	slash: true,
	options: [
		{
			name: 'music',
			description: i18n.__('play.option'),
			type: 'STRING',
			required: true,
		},
	],
	async callback({ message, interaction, args, prefix }) {
		var i;
		if (!message) {
			i = interaction;
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ ephemeral: true });
			}
		} else if (!interaction) {
			i = message;
		}
		const { channel } = i.member.voice;
		const serverQueue = i.client.queue.get(i.guildId);
		if (!channel) {
			return reply({
				message,
				interaction,
				content: i18n.__('playlist.errorNotChannel'),
				ephemeral: true,
			});
		}
		const permissions = channel.permissionsFor(i.client.user);
		if (!permissions.has('CONNECT')) {
			return reply({
				message,
				interaction,
				content: i18n.__('playlist.missingPermissionConnect'),
				ephemeral: true,
			});
		}
		if (!permissions.has('SPEAK')) {
			return reply({
				message,
				interaction,
				content: i18n.__('missingPermissionSpeak'),
				ephemeral: true,
			});
		}
		if (serverQueue && channel !== i.guild.me.voice.channel) {
			return reply({
				message,
				interaction,
				content: i18n.__mf('play.errorNotInSameChannel', {
					user: i.client.user.id,
				}),
				ephemeral: true,
			});
		}

		await playdl.setToken({
			spotify: {
				client_id: process.env.SPOTIFY_CLIENT,
				client_secret: process.env.SPOTIFY_SECRET,
				refresh_token: process.env.SPOTIFY_REFRESH,
				market: process.env.SPOTIFY_MARKET,
			},
		});

		if (playdl.is_expired()) {
			await playdl.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
		}

		const search = args.join(' ');
		const url = args[0];
		const isSpotify = playdl.sp_validate(url);
		const isYt = playdl.yt_validate(url);

		const queueConstruct = {
			textChannel: i.channel,
			channel,
			connection: null,
			songs: [],
			loop: false,
			volume: DEFAULT_VOLUME || 100,
			playing: true,
		};

		var searching = {};
		if (message) {
			searching = await message.reply(i18n.__('playlist.searching'));
		} else if (interaction) {
			searching = await interaction.reply({ content: i18n.__('playlist.searching'), ephemeral: true });
		}
		if (message) {
			message.delete();
			console.log(message.id);
		}

		var videos = [];
		var playlistTitle = '';
		if (isYt === 'playlist') {
			try {
				let playlist = await playdl.playlist_info(url, { incomplete: true });
				playlistTitle = playlist.title;
				await playlist.fetch(MAX_PLAYLIST_SIZE);
				let vidInfo = playlist.videos;
				vidInfo.slice(0, MAX_PLAYLIST_SIZE + 1).forEach((video) => {
					let song = {
						title: video.title,
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
				await playlist.fetch(MAX_PLAYLIST_SIZE);
				playlistTitle = playlist.name;
				const tracks = await playlist.fetched_tracks.get('1');

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
						title: searchResult?.title,
						url: searchResult?.url,
						thumbUrl: searchResult?.maxRes.url,
						duration: searchResult?.durationInSec,
					};
					videos.push(song);
				}
				if (message) {
					searching.delete().catch(console.error);
				}
			} catch (error) {
				console.error(error);
				if (message) {
					searching.delete().catch(console.error);
				}
				return reply({ message, interaction, content: error.message, ephemeral: true });
			}
		} else {
			try {
				let [playlist] = await playdl.search(search, {
					source: { youtube: 'playlist' },
					limit: 1,
				});
				await playlist.all_videos();
				for (
					let i = 0;
					i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) && i < playlist.videos.length;
					i++
				) {
					let video = playlist.videos[i];
					let song = {
						title: video.title,
						url: video.url,
						thumbUrl: video.thumbnails[search.thumbnails.length - 1].url,
						duration: video.durationInSec,
					};
					videos.push(song);
				}
				if (message) {
					searching.delete().catch(console.error);
				}
			} catch (error) {
				if (message) {
					searching.delete().catch(console.error);
				}
				console.error(error);
				return reply({ message, interaction, content: error.message, ephemeral: true });
			}
		}
		if (serverQueue) {
			serverQueue.songs.push(...videos);
			npMessage({ message, interaction, npSong: serverQueue.songs[0], prefix });
			followUp({
				message,
				interaction,
				content: i18n.__mf('playlist.queueAdded', {
					playlist: playlistTitle,
					author: i.member.id,
				}),
				ephemeral: false,
			});
		} else {
			queueConstruct.songs.push(...videos);
		}
		if (!serverQueue) {
			i.client.queue.set(i.guildId, queueConstruct);

			try {
				if (!voice.getVoiceConnection(i.guildId)) {
					queueConstruct.connection = await voice.joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guildId,
						selfDeaf: true,
						adapterCreator: channel.guild.voiceAdapterCreator,
					});
				}
				followUp({
					message,
					interaction,
					content: i18n.__mf('playlist.queueAdded', {
						playlist: playlistTitle,
						author: i.member.id,
					}),
					ephemeral: false,
				});
				play({ song: queueConstruct.songs[0], message, interaction, prefix });
			} catch (error) {
				console.error(error);
				i.client.queue.delete(i.guildId);
				await queueConstruct.connection.destroy();
				return followUp({
					message,
					interaction,
					content: i18n.__('play.cantJoinChannel', { error }),
					ephemeral: true,
				});
			}
		}
		// TODO this used to return 1 but i cant remember why so i've removed it
		// return;
	},
};
