const { play } = require('@include/play');
const ytdl = require('ytdl-core-discord');
const YouTubeAPI = require('simple-youtube-api');
const scdl = require('soundcloud-downloader').default;
const https = require('https');
const { YOUTUBE_API_KEY, SOUNDCLOUD_CLIENT_ID, LOCALE, DEFAULT_VOLUME } = require('@util/utils');
const i18n = require('i18n');
const XMLHttpRequest = require('xhr2');
const Commando = require('discord.js-commando');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const sql = require('sqlite');
const config = require('@root/config.json');

i18n.setLocale(LOCALE);
const {MSGTIMEOUT} = config;
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
require('module-alias/register');

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
		let db = {};
		// console.log(path.resolve(__dirname, '../../data/serverData.sqlite'));
		db = await sql.open({
			filename: path.resolve(__dirname, '../../data/serverData.sqlite'),
			driver: sqlite3.cached.Database,
		}).then((thedb) => thedb);

		// TODO include fallback for no music channel registered
		const MUSIC_CHANNEL_ID = await db.get(`SELECT * FROM servers WHERE guildId='${message.guild.id}'`).then(row => {
			// console.log(row.channelId);
			if (row) {
				return row.channelId;
			}
			return '';
		}).catch(console.error);
		// console.log(MUSIC_CHANNEL_ID);
		if (message.channel.id !== MUSIC_CHANNEL_ID) {
			return message.reply('This command can only be used in the music channel');
		}

		const { channel } = message.member.voice;
		message.delete();
		const serverQueue = message.client.queue.get(message.guild.id);
		// console.log(serverQueue);
		if (!channel) return message.reply(i18n.__('play.errorNotChannel')).then((msg) => {
			msg.delete({ timeout: MSGTIMEOUT });
		}).catch(console.error);
		if (serverQueue && channel !== message.guild.me.voice.channel) {
			return message
				.reply(i18n.__mf('play.errorNotInSameChannel', { user: message.client.user }))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}
		if (!args.length) {
			return message
				.reply(i18n.__mf('play.usageReply', { prefix: message.client.prefix }))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}
		const permissions = channel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) return message.reply(i18n.__('play.missingPermissionConnect')).then(msg => {
			msg.delete({ timeout: MSGTIMEOUT })
		}).catch(console.error);
		if (!permissions.has('SPEAK')) return message.reply(i18n.__('play.missingPermissionSpeak')).then(msg => {
			msg.delete({ timeout: MSGTIMEOUT })
		}).catch(console.error);

		const search = args.join(' ');
		const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
		const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
		const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
		const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;
		const url = args[0];
		const urlValid = videoPattern.test(args[0]);

		//  Start the playlist if playlist url was provided
		if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
			return message.client.commands.get('playlist').execute(message, args);
		} else if (scdl.isValidUrl(url) && url.includes('/sets/')) {
			return message.client.commands.get('playlist').execute(message, args);
		}

		if (mobileScRegex.test(url)) {
			try {
				https.get(url, function (res) {
					if (res.statusCode == '302') {
						return message.client.commands.get('play').execute(message, [res.headers.location]);
					} else {
						return message.reply('No content could be found at that url.').then(msg => {
							msg.delete({ timeout: MSGTIMEOUT })
						}).catch(console.error);
					}
				});
			} catch (error) {
				console.error(error);
				return message.reply(error.message).catch(console.error);
			}
			return message.reply('Following url redirection...').then(msg => {
				msg.delete({ timeout: MSGTIMEOUT })
			}).catch(console.error);
		}

		const queueConstruct = {
			textChannel: message.channel,
			channel,
			connection: null,
			songs: [],
			loop: false,
			volume: DEFAULT_VOLUME || 100,
			playing: true
		};

		let songInfo = null;
		let song = null;
		// TODO this functions always seems to return undefined so the default thumbnail is used everytime
		async function checkImage(url1) {
			var req = new XMLHttpRequest();
			req.open('HEAD', url1, true);
			await req.send();
			console.log(req.status);
			if (req.status == 200) {
				return true
			}
			else return false
		};


		if (urlValid) {
			try {
				songInfo = await ytdl.getBasicInfo(url);
				var songId = await ytdl.getURLVideoID(url)


				if (await checkImage(`https:// img.youtube.com/vi/${songId}/0.jpg`)) {
					var songThumb = `https:// img.youtube.com/vi/${songId}/0.jpg`

				}
				else if (await checkImage(`https:// img.youtube.com/vi/${songId}/maxresdefault.jpg`)) {
					var songThumb = `https:// img.youtube.com/vi/${songId}/maxresdefault.jpg`
				}
				else {
					var songThumb = 'https:// i.imgur.com/TObp4E6.jpg'
					console.log('No thumb')
				};

				// console.log(songThumb);

				song = {
					title: songInfo.videoDetails.title,
					url: songInfo.videoDetails.video_url,
					thumbUrl: songThumb,
					duration: songInfo.videoDetails.lengthSeconds
				};
				// console.log(song);
			} catch (error) {
				console.error(error);
				return message.reply(error.message).then(msg => {
					msg.delete({ timeout: MSGTIMEOUT })
				}).catch(console.error);
			}
		} else if (scRegex.test(url)) {
			try {
				const trackInfo = await scdl.getInfo(url, SOUNDCLOUD_CLIENT_ID);
				song = {
					title: trackInfo.title,
					url: trackInfo.permalink_url,
					duration: Math.ceil(trackInfo.duration / 1000)
				};
			} catch (error) {
				console.error(error);
				return message.reply(error.message).then(msg => {
					msg.delete({ timeout: MSGTIMEOUT })
				}).catch(console.error);
			}
		} else {
			try {
				// console.log('results');
				const results = await youtube.searchVideos(search, 1, { part: 'snippet' });
				// console.log('getInfo start');
				songInfo = await ytdl.getBasicInfo(results[0].url);
				//  console.log('getinfo end');
				var songId = await ytdl.getURLVideoID(results[0].url)

				var test = await checkImage(`https:// img.youtube.com/vi/${songId}/maxresdefault.jpg`);
				console.log(test);
				if (await checkImage(`https:// img.youtube.com/vi/${songId}/maxresdefault.jpg`)) {
					var songThumb = `https:// img.youtube.com/vi/${songId}/maxresdefault.jpg`
				}
				else if (await checkImage(`https:// img.youtube.com/vi/${songId}/hqdefault.jpg`)) {
					var songThumb = `https:// img.youtube.com/vi/${songId}/hqdefault.jpg`
				}
				else {
					var songThumb = 'https:// i.imgur.com/TObp4E6.jpg'
					console.log('No thumb')
				};
				song = {
					title: songInfo.videoDetails.title,
					url: songInfo.videoDetails.video_url,
					thumbUrl: songThumb,
					duration: songInfo.videoDetails.lengthSeconds
				};
			} catch (error) {
				console.error(error);
				return message.reply(error.message).then(msg => {
					msg.delete({ timeout: MSGTIMEOUT })
				}).catch(console.error);
			}
		}
		// DEBUG
		// console.log(`ServerQueue: ${serverQueue}`); TODO message timeout
		if (serverQueue) {
			serverQueue.songs.push(song);
			return serverQueue.textChannel
				.send(i18n.__mf('play.queueAdded', { title: song.title, author: message.author }))
				.then(msg => {
					msg.delete({ timeout: MSGTIMEOUT })
				}).catch(console.error);
		}

		queueConstruct.songs.push(song);
		message.client.queue.set(message.guild.id, queueConstruct);
		try {
			queueConstruct.connection = await channel.join();
			await queueConstruct.connection.voice.setSelfDeaf(true);
			play(queueConstruct.songs[0], message);
			// message.channel.send('DELETING MESSAGE NOW');
			// message.delete();
		} catch (error) {
			console.error(error);
			message.client.queue.delete(message.guild.id);
			await channel.leave();
			return message.channel.send(i18n.__('play.cantJoinChannel', { error: error })).then(msg => {
				msg.delete({ timeout: MSGTIMEOUT })
			}).catch(console.error);
		};

		return 1;
	};
};
