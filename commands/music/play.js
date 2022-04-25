require('module-alias/register');
const { play } = require('@include/play');
const ytdl = require('ytdl-core-discord');
const YouTubeAPI = require('simple-youtube-api');
const scdl = require('soundcloud-downloader').default;
const https = require('https');
const { YOUTUBE_API_KEY, SOUNDCLOUD_CLIENT_ID, LOCALE, DEFAULT_VOLUME } = require(`${__base}util/utils`);
const i18n = require('i18n');
const Commando = require('discord.js-commando');
const config = require('@root/config.json');
const { npMessage } = require(`${__base}include/npmessage`);

i18n.setLocale(LOCALE);
const { MSGTIMEOUT } = config;
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = class playCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'play',
			group: 'music',
			memberName: 'play',
			description: i18n.__('play.description'),
			guildOnly: 'true',
		});
	}

	async run(message, args) {
		const prefix = message.guild.commandPrefix;
		const MUSIC_CHANNEL_ID = message.guild.settings.get('musicChannel');

		const { channel } = message.member.voice;

		const serverQueue = message.client.queue.get(message.guild.id);
		if (!channel) {
			return message.reply(i18n.__('play.errorNotChannel')).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
		}
		if (serverQueue && channel !== message.guild.me.voice.channel) {
			return message
				.reply(i18n.__mf('play.errorNotInSameChannel', { user: message.client.user }))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}
		if (!args.length) {
			return message
				.reply(i18n.__mf('play.usageReply', { prefix }))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}
		const permissions = channel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) {
			return message.reply(i18n.__('play.missingPermissionConnect')).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
		}
		if (!permissions.has('SPEAK')) {
			return message.reply(i18n.__('play.missingPermissionSpeak')).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
		}

		const search = args.join(' ');
		const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
		const playlistPattern = /^.*(list=)([^#&?]*).*/gi;
		const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
		const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;
		const url = args[0];
		const urlValid = videoPattern.test(args[0]);

		//  Start the playlist if playlist url was provided
		if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
			args.playlist = args[0];
			return message.client.registry.resolveCommand('playlist').run(message, args);
		}
		if (scdl.isValidUrl(url) && url.includes('/sets/')) {
			return message.client.registry.resolveCommand('playlist').run(message, args);
		}

		message.delete({ TIMEOUT: MSGTIMEOUT });
		if (mobileScRegex.test(url)) {
			try {
				https.get(url, (res) => {
					if (res.statusCode == '302') {
						return message.client.commands.get('play').execute(message, [res.headers.location]);
					}
					return message.reply('No content could be found at that url.').then((msg) => {
						msg.delete({ timeout: MSGTIMEOUT });
					}).catch(console.error);
				});
			} catch (error) {
				console.error(error);
				return message.reply(error.message).catch(console.error);
			}
			return message.reply('Following url redirection...').then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
		}

		const queueConstruct = {
			textChannel: message.channel,
			channel,
			connection: null,
			songs: [],
			loop: false,
			volume: DEFAULT_VOLUME || 100,
			playing: true,
		};

		let songInfo = null;
		let song = null;

		if (urlValid) {
			try {
				songInfo = await ytdl.getBasicInfo(url).videoDetails;
				const { thumbnails } = songInfo;
				song = {
					title: songInfo.title,
					url: songInfo.video_url,
					thumbUrl: thumbnails[thumbnails.length - 1].url,
					duration: songInfo.lengthSeconds,
				};
				// console.log(song);
			} catch (error) {
				console.error(error);
				return message.reply(error.message).then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
			}
		} else if (scRegex.test(url)) {
			try {
				const trackInfo = await scdl.getInfo(url, SOUNDCLOUD_CLIENT_ID);
				song = {
					title: trackInfo.title,
					url: trackInfo.permalink_url,
					duration: Math.ceil(trackInfo.duration / 1000),
				};
			} catch (error) {
				console.error(error);
				return message.reply(error.message).then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
			}
		} else {
			try {
				const results = await youtube.searchVideos(search, 1, { part: 'snippet' });
				songInfo = (await ytdl.getBasicInfo(results[0].url)).videoDetails;
				const { thumbnails } = songInfo;
				song = {
					title: songInfo.title,
					url: songInfo.video_url,
					thumbUrl: thumbnails[thumbnails.length - 1].url,
					duration: songInfo.lengthSeconds,
				};
			} catch (error) {
				console.error(error);
				return message.reply(error.message).then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
			}
		}

		if (serverQueue) {
			serverQueue.songs.push(song);
			npMessage({ message, npSong: serverQueue.songs[0] });
			return serverQueue.textChannel
				.send(i18n.__mf('play.queueAdded', { title: song.title, author: message.author }))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}

		queueConstruct.songs.push(song);
		message.client.queue.set(message.guild.id, queueConstruct);
		try {
			queueConstruct.connection = await channel.join();
			await queueConstruct.connection.voice.setSelfDeaf(true);
			play(queueConstruct.songs[0], message);
		} catch (error) {
			console.error(error);
			message.client.queue.delete(message.guild.id);
			await channel.leave();
			return message.channel.send(i18n.__('play.cantJoinChannel', { error })).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
		}

		return 1;
	}
};
