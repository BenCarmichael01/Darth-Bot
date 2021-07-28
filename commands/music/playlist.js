const { play } = require('@include/play');
const { npMessage } = require('@include/npmessage');
const YouTubeAPI = require('simple-youtube-api');
const scdl = require('soundcloud-downloader').default;
const Commando = require('discord.js-commando');
const i18n = require('i18n');

const {
	YOUTUBE_API_KEY,
	SOUNDCLOUD_CLIENT_ID,
	MAX_PLAYLIST_SIZE,
	DEFAULT_VOLUME,
	LOCALE,
} = require('@util/utils');

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = class playlistCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'playlist',
			group: 'music',
			memberName: 'playlist',
			description: i18n.__('playlist.description'),
			guildOnly: 'true',
			argsType: 'multiple',
		});
	}

	async run(message, args) {
		const { channel } = message.member.voice;
		const serverQueue = message.client.queue.get(message.guild.id);

		if (!args.length) {
			return message
				.reply(i18n.__mf('playlist.usageReply', { prefix: message.client.prefix }))
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

		const search = args.join(' ');
		const pattern = /^.*(youtu.be\/|list=)([^#&?]*).*/gi;
		const url = args[0];
		const urlValid = pattern.test(args[0]);

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
		} else if (scdl.isValidUrl(args[0])) {
			if (args[0].includes('/sets/')) {
				message.channel.send(i18n.__('playlist.fetchingPlaylist'));
				playlist = await scdl.getSetInfo(args[0], SOUNDCLOUD_CLIENT_ID);
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
			.filter((video) => video.title != 'Private video' && video.title != 'Deleted video')
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
		serverQueue ? serverQueue.songs.push(...newSongs) : queueConstruct.songs.push(...newSongs);
		if (serverQueue) {
			npMessage(message, serverQueue.songs[0]);
		};
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
				return message.channel.send(i18n.__('play.cantJoinChannel', { error: error })).catch(console.error);
			}
		}
		return 1;
	}
};
