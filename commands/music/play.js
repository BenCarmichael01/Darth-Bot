/* global __base */
const { play } = require(`${__base}include/play`);
const YouTubeAPI = require('simple-youtube-api');
const playdl = require('play-dl');
const i18n = require('i18n');
const voice = require('@discordjs/voice');

const { npMessage } = require(`${__base}/include/npmessage`);
const { YOUTUBE_API_KEY, LOCALE, DEFAULT_VOLUME, MSGTIMEOUT } = require(`${__base}include/utils`);
const { reply, followUp } = require(`${__base}include/responses`);

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
	name: 'play',
	category: 'music',
	description: i18n.__('play.description'),
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

	async callback({ message, interaction, args, prefix, instance }) {
		var i;
		if (!message) {
			if (!interaction.deferred && !interaction.replied) {
				await interaction.deferReply({ ephemeral: true });
			}
			i = interaction;
			i.isInteraction = true;
		} else if (!interaction) {
			i = message;
			i.isInteraction = false;
		}

		const settings = await i.client.db.get(i.guildId);
		if (!settings?.musicChannel) {
			await reply({ message, interaction, content: i18n.__('common.noSetup'), ephemeral: true });
			message?.delete();
			return;
		}

		const userVc = await i.member.voice?.channel;
		const channel = await i.guild.me.voice.channel;
		const serverQueue = await i.client.queue.get(i.guildId);

		if (!userVc) {
			reply({ message, interaction, content: i18n.__('play.errorNotChannel'), ephemeral: true });
			message?.delete();
			return;
		}
		if (serverQueue && userVc !== i.guild.me.voice.channel) {
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
		const permissions = userVc.permissionsFor(i.client.user);
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
			instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
			return;
		}
		if (isSpotify === 'playlist' || isSpotify === 'album') {
			instance.commandHandler.getCommand('playlist').callback({ message, interaction, args, prefix });
			return;
		}

		const queueConstruct = {
			textChannel: await i.guild.channels.fetch(settings.musicChannel),
			channel,
			connection: null,
			player: null,
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
				followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
				});
				return;
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
				followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
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
					title: searchResult.title,
					url: searchResult.url,
					thumbUrl: searchResult.maxRes.url,
					duration: searchResult.durationSeconds,
				};
			} catch (error) {
				console.error(error);
				followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
				});
				message ? message.delete() : null;
				return;
			}
		}

		if (serverQueue?.songs.length > 0) {
			serverQueue.songs.push(song);
			npMessage({ interaction, message, npSong: serverQueue.songs[0], prefix });
			await reply({ message, interaction, content: i18n.__('play.success'), ephemeral: true });
			message ? message.delete() : null;
			serverQueue.textChannel
				.send(
					i18n.__mf('play.queueAdded', {
						title: song.title,
						author: i.member.id,
					}),
				)
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
			return;
		}

		queueConstruct.songs.push(song);
		i.client.queue.set(i.guildId, queueConstruct);
		try {
			if (!voice.getVoiceConnection(i.guildId)) {
				queueConstruct.connection = voice.joinVoiceChannel({
					channelId: userVc.id,
					guildId: userVc.guildId,
					selfDeaf: true,
					adapterCreator: userVc.guild.voiceAdapterCreator,
				});
			}
			play({ song: queueConstruct.songs[0], message, interaction, prefix });
			await reply({ message, interaction, content: i18n.__('play.success'), ephemeral: true });
			message ? message.delete() : null;
			queueConstruct.textChannel
				.send({
					content: i18n.__mf('play.queueAdded', {
						title: queueConstruct.songs[0].title,
						author: i.member.id,
					}),
				})
				.then((msg) => {
					setTimeout(() => {
						msg.delete().catch(console.error);
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		} catch (error) {
			console.error(error);
			i.client.queue.delete(i.guildId);
			await queueConstruct.connection.destroy();
			followUp({
				message,
				interaction,
				content: i18n.__('play.cantJoinChannel', { error: error.message }),
				ephemeral: true,
			});
			message ? message.delete() : null;
			return;
		}

		return;
	},
};
