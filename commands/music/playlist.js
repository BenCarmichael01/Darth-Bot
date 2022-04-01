/* global __base */
const { play } = require(`${__base}include/play`);
const { npMessage } = require(`${__base}include/npmessage`);
const i18n = require('i18n');
const voice = require('@discordjs/voice');
const playdl = require('play-dl');
const YouTubeAPI = require('simple-youtube-api');

const { MAX_PLAYLIST_SIZE, DEFAULT_VOLUME, LOCALE, MSGTIMEOUT } = require(`${__base}/include/utils`);

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(process.env.YOUTUBE_API_KEY);

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
			return message.channel
				.send(i18n.__('playlist.errorNotChannel'))
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
						message.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		const permissions = channel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) {
			return message.channel
				.send(i18n.__('playlist.missingPermissionConnect'))
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
						message.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!permissions.has('SPEAK')) {
			return message.channel
				.send(i18n.__('missingPermissionSpeak'))
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
						message.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (serverQueue && channel !== message.guild.me.voice.channel) {
			return message.channel
				.send(
					i18n.__mf('play.errorNotInSameChannel', {
						user: message.client.user,
					}),
				)
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
						message.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (playdl.is_expired()) {
			await playdl.refreshToken(); // This will check if access token has expired or not. If yes, then refresh the token.
		}
		message.delete();

		const search = args.join(' ');
		const url = args[0];
		const isSpotify = playdl.sp_validate(url);
		const isYt = playdl.yt_validate(url);

		const queueConstruct = {
			textChannel: message.channel,
			channel,
			connection: null,
			songs: [],
			loop: false,
			volume: DEFAULT_VOLUME || 100,
			playing: true,
		};

		var searching = await message.channel.send(i18n.__('playlist.searching'));

		var videos = [];
		var playlistTitle = '';
		if (isYt === 'playlist') {
			try {
				console.time('ytplay');
				let playlist = await playdl.playlist_info(url);
				playlistTitle = playlist.title;
				await playlist.fetch(MAX_PLAYLIST_SIZE);
				console.timeEnd('ytplay');
				let vidInfo = playlist.videos;
				vidInfo.forEach((video) => {
					let song = {
						title: video.title,
						url: video.url,
						thumbUrl: video.thumbnails[video.thumbnails.length - 1].url,
						duration: video.durationInSec,
					};
					videos.push(song);
				});
				// for (
				// 	let i = 0;
				// 	i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) && i < playlist.videos.length;
				// 	i++
				// ) {
				// 	let video = iterator.next().value;
				// 	let song = {
				// 		title: video.title,
				// 		url: video.url,
				// 		thumbUrl: video.thumbnails[search.thumbnails.length - 1].url,
				// 		duration: video.durationInSec,
				// 	};
				// 	videos.push(song);
				// }
				searching.delete().catch(console.error);
			} catch (error) {
				console.error(error);
				searching.delete().catch(console.error);
				return message.channel
					.send(i18n.__('playlist.errorNotFoundPlaylist'))
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					})
					.catch(console.error);
			}
		} else if (isSpotify === 'playlist') {
			try {
				let playlist = await playdl.spotify(url);
				playlistTitle = playlist.name;
				await playlist.fetch(MAX_PLAYLIST_SIZE);
				const tracks = await playlist.fetched_tracks.get('1');

				if (tracks.length > MAX_PLAYLIST_SIZE) {
					message.channel
						.send(i18n.__mf('playlist.maxSize', { maxSize: MAX_PLAYLIST_SIZE }))
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						})
						.catch(console.error);
				}
				// await tracks.forEach(async (track) => {
				// 	let term = track.name.concat(' ', track.artists[0].name);
				// 	let [search] = await playdl.search(term, {
				// 		source: { youtube: 'video' },
				// 		limit: 1,
				// 	});
				// 	let song = {
				// 		title: search.title,
				// 		url: search.url,
				// 		thumbUrl: search.thumbnails[search.thumbnails.length - 1].url,
				// 		duration: search.durationInSec,
				// 	};
				// 	videos.push(song);
				// });
				for (let i = 0; i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 20) && i < tracks.length; i++) {
					console.time('api');
					let search = tracks[i].name + ' ' + tracks[i].artists[0].name;
					console.log(search);
					const results = await youtube.searchVideos(search, 1, {
						part: 'snippet.title, snippet.maxRes, snippet.durationSeconds',
					});
					console.timeEnd('api');
					// let [search] = await playdl.search(tracks[i].name, {
					// 	source: { youtube: 'video' },
					// 	limit: 1,
					// });
					const searchResult = results[0];
					if (!searchResult) continue;
					let song = {
						title: searchResult?.title,
						url: searchResult?.url,
						thumbUrl: searchResult?.maxRes.url,
						// thumbUrl: search.thumbnails[search.thumbnails.length - 1].url,
						duration: searchResult?.durationInSec,
					};
					videos.push(song);
				}
				searching.delete().catch(console.error);
			} catch (error) {
				console.error(error);
				searching.delete().catch(console.error);
				return message.channel
					.send(error.message)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					})
					.catch(console.error);
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
				searching.delete().catch(console.error);
			} catch (error) {
				searching.delete().catch(console.error);
				console.error(error);
				return message.channel
					.send(error.message)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					})
					.catch(console.error);
			}
		}
		if (serverQueue) {
			serverQueue.songs.push(...videos);
			npMessage({ message, npSong: serverQueue.songs[0], prefix });
			message.channel
				.send(i18n.__mf('playlist.queueAdded', { playlist: playlistTitle, author: message.author }))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		} else {
			queueConstruct.songs.push(...videos);
		}
		// serverQueue ? serverQueue.songs.push(...newSongs) : queueConstruct.songs.push(...newSongs);
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
				message.channel
					.send(
						i18n.__mf('playlist.queueAdded', { playlist: playlistTitle, author: message.author }),
					)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					})
					.catch(console.error);
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
