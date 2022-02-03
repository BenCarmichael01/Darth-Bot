/* global __base */
const { play } = require(`${__base}include/play`);
const { npMessage } = require(`${__base}include/npmessage`);
const YouTubeAPI = require('simple-youtube-api');
const i18n = require('i18n');
const voice = require('@discordjs/voice');
const playdl = require('play-dl');

const {
	YOUTUBE_API_KEY,
	MAX_PLAYLIST_SIZE,
	DEFAULT_VOLUME,
	LOCALE,
	MSGTIMEOUT,
} = require(`${__base}/include/utils`);

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
	name: 'playlist',
	category: 'music',
	description: i18n.__('playlist.description'),
	guildOnly: 'true',
	/* args: [{
		key: 'playlist',
		prompt: i18n.__('playlist.prompt'),
		type: 'string',
	}],
	argsType: 'multiple', */

	// TODO MSGTIMEOUT
	async callback({ message, args, prefix }) {
		const { channel } = message.member.voice;
		// const channel = await message.guild.channels.fetch("856658520728141834");
		const serverQueue = message.client.queue.get(message.guild.id);

		// if (!args[0]) {
		// 	return message
		// 		.reply(i18n.__mf('playlist.usageReply', { prefix: message.guild.commandPrefix }))
		// 		.catch(console.error);
		// }
		if (!channel) {
			return message
				.reply(i18n.__('playlist.errorNotChannel'))
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		const permissions = channel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) {
			return message
				.reply(i18n.__('playlist.missingPermissionConnect'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!permissions.has('SPEAK')) {
			return message
				.reply(i18n.__('missingPermissionSpeak'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (serverQueue && channel !== message.guild.me.voice.channel) {
			return message
				.reply(
					i18n.__mf('play.errorNotInSameChannel', {
						user: message.client.user,
					}),
				)
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (playdl.is_expired()) {
			await playdl.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
		}
		message.delete();

		const ytPlaylistPattern = /^.*(list=)([^#&?]*).*/gi;
		const spotPlaylistPattern =
			/^https?:\/\/(?:open|play)\.spotify\.com\/playlist\/.+$/i;

		const search = args.join(' ');
		const url = args[0];
		const isYtPlaylist = ytPlaylistPattern.test(url);

		const isSpotifyPlaylist = spotPlaylistPattern.test(url);

		const queueConstruct = {
			textChannel: message.channel,
			channel,
			connection: null,
			songs: [],
			loop: false,
			volume: DEFAULT_VOLUME || 100,
			playing: true,
		};

		let videos = [];

		if (isYtPlaylist) {
			try {
				let [playlist] = await playdl.search(search, {
					source: { youtube: 'playlist' },
					limit: 1,
				});

				for (
					let i = 0;
					i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) &&
					i < playlist.videos.length;
					i++
				) {
					let video = playlist.videos[i];
					let song = {
						title: video.title,
						url: video.url,
						thumbUrl:
							video.thumbnails[search.thumbnails.length - 1].url,
						duration: video.durationInSec,
					};
					videos.push(song);
				}
			} catch (error) {
				console.error(error);
				return message
					.reply(i18n.__('playlist.errorNotFoundPlaylist'))
					.catch(console.error);
			}
		} else if (isSpotifyPlaylist) {
			try {
				let playlist = await playdl.spotify(url);
				const tracks = await playlist.all_tracks();
				// Need possible playlist.fetch() here
				for (
					let i = 0;
					i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) &&
					i < tracks.length;
					i++
				) {
					let [search] = await playdl.search(tracks[i].name, {
						source: { youtube: 'video' },
						limit: 1,
					});

					let song = {
						title: search.title,
						url: search.url,
						thumbUrl:
							search.thumbnails[search.thumbnails.length - 1].url,
						duration: search.durationInSec,
					};
					videos.push(song);
				}
			} catch (error) {
				console.error(error);
				return message.channel.send(error.message).catch(console.error);
			}
		} else {
			try {
				let [playlist] = await playdl.search(search, {
					source: { youtube: 'playlist' },
					limit: 1,
				});
				let vids = await playlist.all_videos();
				console.log(vids);
				// const results = await youtube.searchPlaylists(search, 1, {
				// 	part: "snippet"
				// });
				// [playlist] = results;
				for (
					let i = 0;
					i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) &&
					i < playlist.videos.length;
					i++
				) {
					let video = playlist.videos[i];
					let song = {
						title: video.title,
						url: video.url,
						thumbUrl:
							video.thumbnails[search.thumbnails.length - 1].url,
						duration: video.durationInSec,
					};
					videos.push(song);
				}
			} catch (error) {
				console.error(error);
				return message.channel
					.send(error.message)
					.then((msg) => {
						msg.delete();
					})
					.catch(console.error);
			}
		}

		// const newSongs = videos
		// 	.filter(
		// 		(video) =>
		// 			video.title !== "Private video" && video.title !== "Deleted video"
		// 	)
		// 	.map((video) => {
		// 		const { thumbnails } = video;
		// 		const thumbIndex = Object.keys(thumbnails).length - 1;
		// 		const song = {
		// 			title: video.title,
		// 			url: video.url,
		// 			thumbUrl: thumbnails[Object.keys(thumbnails)[thumbIndex]].url,
		// 			duration: video.durationSeconds
		// 		};
		// 		return song;
		// 	});
		if (serverQueue) {
			serverQueue.songs.push(...videos);
		} else {
			console.log('testy');
			queueConstruct.songs.push(...videos);
		}
		// serverQueue ? serverQueue.songs.push(...newSongs) : queueConstruct.songs.push(...newSongs);
		if (serverQueue) {
			npMessage({ message, npSong: serverQueue.songs[0], prefix });
		}
		if (!serverQueue) {
			message.client.queue.set(message.guild.id, queueConstruct);

			try {
				if (!voice.getVoiceConnection(message.guildId)) {
					queueConstruct.connection = await voice.joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guildId,
						selfDeaf: true,
						adapterCreator: channel.guild.voiceAdapterCreator,
					});
				}
				console.log(queueConstruct.songs);
				play(queueConstruct.songs[0], message, prefix);
			} catch (error) {
				console.error(error);
				message.client.queue.delete(message.guild.id);
				await queueConstruct.connection.destroy();
				return message.channel
					.send(i18n.__('play.cantJoinChannel', { error }))
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					})
					.catch(console.error);
			}
		}
		// TODO this used to return 1 but i cant remember why so i've removed it
		// return;
	},
};
