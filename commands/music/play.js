/* global __base */
const { play } = require(`${__base}include/play`);
const YouTubeAPI = require('simple-youtube-api');
const playdl = require('play-dl');
// const scdl = require('soundcloud-downloader').default;
const i18n = require('i18n');
const voice = require('@discordjs/voice');

const { npMessage } = require(`${__base}/include/npmessage`);
const { YOUTUBE_API_KEY, LOCALE, DEFAULT_VOLUME, MSGTIMEOUT } = require(`${__base}include/utils`);
const { findById } = require(`${__base}/include/findById`);

i18n.setLocale(LOCALE);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

function reply({ message, interaction, content, ephemeral }) {
	if (message) {
		return message
			.reply(content)
			.then((msg) => {
				setTimeout(() => {
					message.delete();
					msg.delete();
				}, MSGTIMEOUT);
			})
			.catch(console.error);
	} else if (interaction) {
		if (ephemeral) {
			return interaction.editReply({ content, ephemeral });
		} else {
			return interaction
				.editReply({ content })
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
	}
}
function followUp({ message, interaction, content, ephemeral }) {
	if (message) {
		return message.channel
			.send(content)
			.then((msg) => {
				setTimeout(() => {
					message.delete();
					msg.delete();
				}, MSGTIMEOUT);
			})
			.catch(console.error);
	} else if (interaction) {
		if (ephemeral) {
			return interaction.followUp({ content, ephemeral });
		} else {
			return interaction
				.followUp({ content })
				.then((msg) => {
					setTimeout(() => {
						msg.delete();
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
	}
}
module.exports = {
	name: 'play',
	category: 'music',
	description: i18n.__('play.description'),
	guildOnly: 'true',
	testOnly: true,
	slash: 'both',
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
			i = interaction;
			await interaction.deferReply({ ephemeral: true });
		} else if (!interaction) {
			i = message;
		}
		// const channel = await message.guild.channels.fetch('856658520728141834');
		const userVc = await i.member.voice?.channel;
		const channel = await i.guild.me.voice.channel;
		const serverQueue = i.client.queue.get(i.guildId);

		// Try switch case? to remove repetition of message.delete();
		if (!userVc) {
			return reply({ message, interaction, content: i18n.__('play.errorNotChannel'), ephemeral: true });
		}
		if (serverQueue && userVc !== message.guild.me.voice.channel) {
			return reply({
				message,
				interaction,
				content: i18n.__mf('play.errorNotInSameChannel', {
					user: message.client.user,
				}),
				ephemeral: true,
			});
			// return message
			// 	.reply(
			// 		i18n.__mf('play.errorNotInSameChannel', {
			// 			user: message.client.user,
			// 		}),
			// 	)
			// 	.then((msg) => {
			// 		setTimeout(() => {
			// 			msg.delete();
			// 			message.delete();
			// 		}, MSGTIMEOUT);
			// })
			// .catch(console.error);
		}
		if (!args.length) {
			return reply({
				message,
				interaction,
				content: i18n.__mf('play.usageReply', { prefix }),
				ephemeral: true,
			});
			// return message
			// 	.reply(i18n.__mf('play.usageReply', { prefix }))
			// 	.then((msg) => {
			// 		setTimeout(() => {
			// 			msg.delete();
			// 			message.delete();
			// 		}, MSGTIMEOUT);
			// 	})
			// 	.catch(console.error);
		}
		const permissions = userVc.permissionsFor(i.client.user);
		if (!permissions.has('CONNECT')) {
			return reply({
				message,
				interaction,
				content: i18n.__('play.missingPermissionConnect'),
				ephemeral: true,
			});
			// return message
			// 	.reply(i18n.__('play.missingPermissionConnect'))
			// 	.then((msg) => {
			// 		setTimeout(() => {
			// 			msg.delete();
			// 			message.delete();
			// 		}, MSGTIMEOUT);
			// 	})
			// 	.catch(console.error);
		}
		if (!permissions.has('SPEAK')) {
			return reply({
				message,
				interaction,
				content: i18n.__('play.missingPermissionSpea'),
				ephemeral: true,
			});
			// return message
			// 	.reply(i18n.__('play.missingPermissionSpeak'))
			// 	.then((msg) => {
			// 		setTimeout(() => {
			// 			msg.delete();
			// 			message.delete();
			// 		}, MSGTIMEOUT);
			// 	})
			// 	.catch(console.error);
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
			return instance.commandHandler
				.getCommand('playlist')
				.callback({ message, interaction, args, prefix });
		}
		if (isSpotify === 'playlist' || isSpotify === 'album') {
			return instance.commandHandler
				.getCommand('playlist')
				.callback({ message, interaction, args, prefix });
		}

		message ? message.delete() : null;
		const queueConstruct = {
			textChannel: i.guild.channels.fetch(findById(i.guildId).musicChannel),
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
				return followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
				});
				// return message.channel
				// 	.send(
				// 		i18n.__mf('play.queueError', {
				// 			error: error.message ? error.message : error,
				// 		}),
				// 	)
				// 	.then((msg) => {
				// 		setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
				// 	})
				// 	.catch(console.error);
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
				return followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
				});
				// return message.channel
				// 	.send(
				// 		i18n.__mf('play.queueError', {
				// 			error: error.message ? error.message : error,
				// 		}),
				// 	)
				// 	.then((msg) => {
				// 		setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
				// 	})
				// 	.catch(console.error);
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
				return followUp({
					message,
					interaction,
					content: i18n.__mf('play.queueError', {
						error: error.message ? error.message : error,
					}),
				});
				// return message.channel
				// 	.send(
				// 		i18n.__mf('play.queueError', {
				// 			error: error.message ? error.message : error,
				// 		}),
				// 	)
				// 	.then((msg) => {
				// 		setTimeout(() => msg.delete(), MSGTIMEOUT + 1_500);
				// 	})
				// 	.catch(console.error);
			}
		}

		if (serverQueue?.songs.length > 0) {
			serverQueue.songs.push(song);
			npMessage({ interaction, message, npSong: serverQueue.songs[0], prefix });
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
		i.client.queue.set(i.guild.id, queueConstruct);
		try {
			if (!voice.getVoiceConnection(i.guildId)) {
				queueConstruct.connection = voice.joinVoiceChannel({
					channelId: userVc.id,
					guildId: userVc.guildId,
					selfDeaf: true,
					adapterCreator: userVc.guild.voiceAdapterCreator,
				});
			}
			// TODO this other play must support interactions as well
			play(queueConstruct.songs[0], i, prefix);
		} catch (error) {
			console.error(error);
			i.client.queue.delete(i.guildId);
			await queueConstruct.connection.destroy();
			// await channel.leave();
			return followUp({
				message,
				interaction,
				content: i18n.__('play.cantJoinChannel', { error }),
				ephemeral: true,
			});
			// return message.channel
			// 	.send(i18n.__('play.cantJoinChannel', { error }))
			// 	.then((msg) => {
			// 		setTimeout(() => msg.delete(), MSGTIMEOUT);
			// 	})
			// 	.catch(console.error);
		}

		return 1;
	},
};
