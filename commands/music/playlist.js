const { play } = require(`${__base}include/play`);
const { npMessage } = require(`${__base}include/npmessage`);
const YouTubeAPI = require('simple-youtube-api');
const scdl = require('soundcloud-downloader').default;
const i18n = require('i18n');

const {
	YOUTUBE_API_KEY,
	SOUNDCLOUD_CLIENT_ID,
	MAX_PLAYLIST_SIZE,
	DEFAULT_VOLUME,
	LOCALE,
	MSGTIMEOUT,
} = require(`${__base}/util/utils`);

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
			name: 'playlist',
			category: 'music',
			description: i18n.__('playlist.description'),
			guildOnly: 'true',
			/*args: [{
				key: 'playlist',
				prompt: i18n.__('playlist.prompt'),
				type: 'string',
			}],
			argsType: 'multiple', */

	async callback(message, args) {
		message.delete({ TIMEOUT: MSGTIMEOUT });
		const { channel } = message.member.voice;
		const serverQueue = message.client.queue.get(message.guild.id);
		
		if (!args.playlist) {
			return message
				.reply(i18n.__mf('playlist.usageReply', { prefix: message.guild.commandPrefix }))
				.catch(console.error);
		}
		if (!channel) return message.reply(i18n.__('playlist.errorNotChannel')).catch(console.error);

		const permissions = channel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) return message.reply(i18n.__('playlist.missingPermissionConnect'));
		if (!permissions.has('SPEAK')) return message.reply(i18n.__('missingPermissionSpeak'));

		if (serverQueue && channel !== message.guild.me.voice.channel) {
			return message
				.reply(i18n.__mf('play.errorNotInSameChannel', { user: message.client.user }))
				.catch(console.error);
		}

		const pattern = /^.*(youtu.be\/|list=)([^#&?]*).*/gi;
		const url = args.playlist;
		const urlValid = pattern.test(args.playlist);
		const search = args.playlist;

		const queueConstruct = {
			textChannel: message.channel,
			channel,
			connection: null,
			songs: [],
			loop: false,
			volume: DEFAULT_VOLUME || 100,
			playing: true,
		};

		let playlist = null;
		let videos = [];

		if (urlValid) {
			try {
				playlist = await youtube.getPlaylist(url, { part: 'snippet' });
				videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: 'snippet' });
			} catch (error) {
				console.error(error);
				return message.reply(i18n.__('playlist.errorNotFoundPlaylist')).catch(console.error);
			}
		} else if (scdl.isValidUrl(args.playlist)) {
			if (args.playlist.includes('/sets/')) {
				message.channel.send(i18n.__('playlist.fetchingPlaylist'));
				playlist = await scdl.getSetInfo(args.playlist, SOUNDCLOUD_CLIENT_ID);
				videos = playlist.tracks.map((track) => ({
					title: track.title,
					url: track.permalink_url,
					duration: track.duration / 1000,
				}));
			}
		} else {
			try {
				const results = await youtube.searchPlaylists(search, 1, { part: 'snippet' });
				[playlist] = results;
				videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: 'snippet' });
			} catch (error) {
				console.error(error);
				return message.reply(error.message).catch(console.error);
			}
		}

		const newSongs = videos
			.filter((video) => video.title !== 'Private video' && video.title !== 'Deleted video')
			.map((video) => {
				const { thumbnails } = video;
				const thumbIndex = Object.keys(thumbnails).length - 1;
				const song = {
					title: video.title,
					url: video.url,
					thumbUrl: thumbnails[Object.keys(thumbnails)[thumbIndex]].url,
					duration: video.durationSeconds,
				};
				return song;
			});
		// console.log(newSongs);
		if (serverQueue) {
			serverQueue.songs.push(...newSongs);
		} else {
			queueConstruct.songs.push(...newSongs);
		}
		// serverQueue ? serverQueue.songs.push(...newSongs) : queueConstruct.songs.push(...newSongs);
		if (serverQueue) {
			npMessage({ message, npSong: serverQueue.songs[0] });
		}
		if (!serverQueue) {
			message.client.queue.set(message.guild.id, queueConstruct);

			try {
				queueConstruct.connection = await channel.join();
				await queueConstruct.connection.voice.setSelfDeaf(true);
				play(queueConstruct.songs[0], message, newSongs);
				// console.log(queueConstruct.songs[0]);
			} catch (error) {
				console.error(error);
				message.client.queue.delete(message.guild.id);
				await channel.leave();
				return message.channel.send(i18n.__('play.cantJoinChannel', { error })).catch(console.error);
			}
		}
		// TODO this used to return 1 but i cant remember why so i've removed it
		return;
	}
};
