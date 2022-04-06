/* global __base */
const { play } = require(`${__base}include/play`);
const YouTubeAPI = require('simple-youtube-api');
const playdl = require('play-dl');
// const scdl = require('soundcloud-downloader').default;
const i18n = require('i18n');
const voice = require('@discordjs/voice');

const { npMessage } = require(`${__base}/include/npmessage`);
const { YOUTUBE_API_KEY, LOCALE, DEFAULT_VOLUME, MSGTIMEOUT } = require(`${__base}include/utils`);

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(process.env.DEV_YOUTUBE_API_KEY);

module.exports = {
	name: 'play',
	category: 'music',
	description: i18n.__('play.description'),
	guildOnly: 'true',

	async callback({ message, args, prefix, instance }) {
		const channel = await message.guild.channels.fetch('856658520728141834');
		const serverQueue = message.client.queue.get(message.guild.id);

		// Try switch case? to remove repetition of message.delete();
		if (!channel) {
			return message
				.reply(i18n.__('play.errorNotChannel'))
				.then((msg) => {
					setTimeout(() => {
						message.delete();
						msg.delete();
					}, MSGTIMEOUT);
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
					setTimeout(() => {
						msg.delete();
						message.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!args.length) {
			return message
				.reply(i18n.__mf('play.usageReply', { prefix }))
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
			return message
				.reply(i18n.__('play.missingPermissionConnect'))
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
						message.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!permissions.has('SPEAK')) {
			return message
				.reply(i18n.__('play.missingPermissionSpeak'))
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
						message.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
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
			await playdl.refreshToken(); // This will check if access token has expired. If yes, then refresh the token.
		}

		const search = args.join(' ');
		const url = args[0];
		const isSpotify = playdl.sp_validate(url);
		const isYt = playdl.yt_validate(url);

		//  Start the playlist if playlist url was provided
		if (isYt === 'playlist') {
			return instance.commandHandler.getCommand('playlist').callback({ message, args, prefix });
		}
		if (isSpotify === 'playlist' || isSpotify === 'album') {
			return instance.commandHandler.getCommand('playlist').callback({ message, args, prefix });
		}

		message.delete();
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

		if (isYt === 'video' && url.startsWith('https')) {
			try {
				songInfo = await youtube.getVideo(url, { part: 'snippet' });
				song = {
					title: songInfo.title,
					url: songInfo.url,
					thumbUrl: songInfo.maxRes.url,
					duration: songInfo.durationSeconds,
				};
			} catch (error) {
				console.error(error);
				return message.channel
					.send(
						i18n.__mf('play.queueError', {
							error: error.message ? error.message : error,
						}),
					)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
					})
					.catch(console.error);
			}
		} else if (isSpotify === 'track') {
			try {
				const spot = await playdl.spotify(url);
				if (spot.type === 'track') {
					const results = await youtube.searchVideos(spot.name, 1, {
						part: 'snippet',
					});
					const searchResult = results[0];
					song = {
						title: searchResult.title,
						url: searchResult.url,
						thumbUrl: searchResult.maxRes.url,
						duration: searchResult.durationSeconds,
					};
				}
			} catch (error) {
				console.error(error);
				return message.channel
					.send(
						i18n.__mf('play.queueError', {
							error: error.message ? error.message : error,
						}),
					)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
					})
					.catch(console.error);
			}
		} else {
			try {
				const results = await youtube.searchVideos(search, 1, {
					part: 'snippet',
				});
				const searchResult = results[0];
				song = {
					title: searchResult.title,
					url: searchResult.url,
					thumbUrl: searchResult.maxRes.url,
					duration: searchResult.durationSeconds,
				};
			} catch (error) {
				console.error(error);
				return message.channel
					.send(
						i18n.__mf('play.queueError', {
							error: error.message ? error.message : error,
						}),
					)
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
					})
					.catch(console.error);
			}
		}

		if (serverQueue?.songs.length > 0) {
			serverQueue.songs.push(song);
			npMessage({ message, npSong: serverQueue.songs[0], prefix });
			return serverQueue.textChannel
				.send(
					i18n.__mf('play.queueAdded', {
						title: song.title,
						author: message.author,
					}),
				)
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}

		queueConstruct.songs.push(song);
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
			play(queueConstruct.songs[0], message, prefix);
		} catch (error) {
			console.error(error);
			message.client.queue.delete(message.guildId);
			await queueConstruct.connection.destroy();
			// await channel.leave();
			return message.channel
				.send(i18n.__('play.cantJoinChannel', { error }))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}

		return 1;
	},
};
