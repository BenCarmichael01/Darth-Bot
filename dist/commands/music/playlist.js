var __awaiter =
	(this && this.__awaiter) ||
	function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
				? value
				: new P(function (resolve) {
						resolve(value);
				  });
		}
		return new (P || (P = Promise))(function (resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator['throw'](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
var __generator =
	(this && this.__generator) ||
	function (thisArg, body) {
		var _ = {
				label: 0,
				sent: function () {
					if (t[0] & 1) throw t[1];
					return t[1];
				},
				trys: [],
				ops: [],
			},
			f,
			y,
			t,
			g;
		return (
			(g = { next: verb(0), throw: verb(1), return: verb(2) }),
			typeof Symbol === 'function' &&
				(g[Symbol.iterator] = function () {
					return this;
				}),
			g
		);
		function verb(n) {
			return function (v) {
				return step([n, v]);
			};
		}
		function step(op) {
			if (f) throw new TypeError('Generator is already executing.');
			while (_)
				try {
					if (
						((f = 1),
						y &&
							(t =
								op[0] & 2
									? y['return']
									: op[0]
									? y['throw'] || ((t = y['return']) && t.call(y), 0)
									: y.next) &&
							!(t = t.call(y, op[1])).done)
					)
						return t;
					if (((y = 0), t)) op = [op[0] & 2, t.value];
					switch (op[0]) {
						case 0:
						case 1:
							t = op;
							break;
						case 4:
							_.label++;
							return { value: op[1], done: false };
						case 5:
							_.label++;
							y = op[1];
							op = [0];
							continue;
						case 7:
							op = _.ops.pop();
							_.trys.pop();
							continue;
						default:
							if (
								!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
								(op[0] === 6 || op[0] === 2)
							) {
								_ = 0;
								continue;
							}
							if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
								_.label = op[1];
								break;
							}
							if (op[0] === 6 && _.label < t[1]) {
								_.label = t[1];
								t = op;
								break;
							}
							if (t && _.label < t[2]) {
								_.label = t[2];
								_.ops.push(op);
								break;
							}
							if (t[2]) _.ops.pop();
							_.trys.pop();
							continue;
					}
					op = body.call(thisArg, _);
				} catch (e) {
					op = [6, e];
					y = 0;
				} finally {
					f = t = 0;
				}
			if (op[0] & 5) throw op[1];
			return { value: op[0] ? op[1] : void 0, done: true };
		}
	};
/* global __base */
var play = require(''.concat(__base, 'include/play')).play;
var npMessage = require(''.concat(__base, 'include/npmessage')).npMessage;
var i18n = require('i18n');
var voice = require('@discordjs/voice');
var playdl = require('play-dl');
var YouTubeAPI = require('simple-youtube-api');
var _a = require(''.concat(__base, '/include/utils')),
	MAX_PLAYLIST_SIZE = _a.MAX_PLAYLIST_SIZE,
	DEFAULT_VOLUME = _a.DEFAULT_VOLUME,
	LOCALE = _a.LOCALE;
var _b = require('../../include/responses'),
	reply = _b.reply,
	followUp = _b.followUp;
// i18n.setLocale(LOCALE);
var youtube = new YouTubeAPI(process.env.YOUTUBE_API_KEY);
module.exports = {
	name: 'playlist',
	category: 'music',
	description: i18n.__('playlist.description'),
	guildOnly: 'true',
	slash: true,
	options: [
		{
			name: 'music',
			description: i18n.__('play.option'),
			type: 'STRING',
			required: true,
		},
	],
	callback: function (_a) {
		var message = _a.message,
			interaction = _a.interaction,
			args = _a.args,
			prefix = _a.prefix;
		return __awaiter(this, void 0, void 0, function () {
			var i,
				settings,
				channelExists,
				channel,
				serverQueue,
				permissions,
				url,
				isSpotify,
				isYt,
				queueConstruct,
				searching,
				videos,
				playlistTitle,
				playlist,
				vidInfo,
				error_1,
				playlist,
				tracks,
				i_1,
				search,
				results,
				searchResult,
				song,
				error_2,
				_b,
				error_3;
			var _c, _d;
			return __generator(this, function (_e) {
				switch (_e.label) {
					case 0:
						if (!!message) return [3 /*break*/, 3];
						i = interaction;
						if (!(!interaction.deferred && !interaction.replied)) return [3 /*break*/, 2];
						return [4 /*yield*/, interaction.deferReply({ ephemeral: true })];
					case 1:
						_e.sent();
						_e.label = 2;
					case 2:
						return [3 /*break*/, 4];
					case 3:
						if (!interaction) {
							i = message;
						}
						_e.label = 4;
					case 4:
						return [4 /*yield*/, i.client.db.get(i.guildId)];
					case 5:
						settings = _e.sent();
						return [4 /*yield*/, i.guild.channels.fetch(settings.musicChannel)];
					case 6:
						channelExists = _e.sent();
						if (
							!(settings === null || settings === void 0 ? void 0 : settings.musicChannel) ||
							!channelExists
						) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('common.noSetup'),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						channel = i.member.voice.channel;
						serverQueue = i.client.queue.get(i.guildId);
						if (!channel) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('playlist.errorNotChannel'),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						permissions = channel.permissionsFor(i.client.user);
						if (!permissions.has('CONNECT')) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('playlist.missingPermissionConnect'),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						if (!permissions.has('SPEAK')) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('missingPermissionSpeak'),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						if (serverQueue && channel !== i.guild.me.voice.channel) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__mf('play.errorNotInSameChannel', {
									user: i.client.user.id,
								}),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						return [
							4 /*yield*/,
							playdl.setToken({
								spotify: {
									client_id: process.env.SPOTIFY_CLIENT,
									client_secret: process.env.SPOTIFY_SECRET,
									refresh_token: process.env.SPOTIFY_REFRESH,
									market: process.env.SPOTIFY_MARKET,
								},
							}),
						];
					case 7:
						_e.sent();
						if (!playdl.is_expired()) return [3 /*break*/, 9];
						return [4 /*yield*/, playdl.refreshToken()];
					case 8:
						_e.sent(); // This will check if access token has expired or not. If yes, then refresh the token.
						_e.label = 9;
					case 9:
						url = args[0];
						isSpotify = playdl.sp_validate(url);
						isYt = playdl.yt_validate(url);
						queueConstruct = {
							textChannel: i.channel,
							channel: channel,
							connection: null,
							songs: [],
							loop: false,
							volume: DEFAULT_VOLUME || 100,
							playing: true,
						};
						searching = {};
						if (!message) return [3 /*break*/, 11];
						return [4 /*yield*/, message.reply(i18n.__('playlist.searching'))];
					case 10:
						searching = _e.sent();
						return [3 /*break*/, 13];
					case 11:
						if (!interaction) return [3 /*break*/, 13];
						return [
							4 /*yield*/,
							interaction.editReply({
								content: i18n.__('playlist.searching'),
								ephemeral: true,
							}),
						];
					case 12:
						searching = _e.sent();
						_e.label = 13;
					case 13:
						if (message) {
							message.delete();
							console.log(message.id);
						}
						videos = [];
						playlistTitle = '';
						if (!(isYt === 'playlist')) return [3 /*break*/, 19];
						_e.label = 14;
					case 14:
						_e.trys.push([14, 17, , 18]);
						return [4 /*yield*/, playdl.playlist_info(url, { incomplete: true })];
					case 15:
						playlist = _e.sent();
						playlistTitle = playlist.title;
						return [4 /*yield*/, playlist.fetch(MAX_PLAYLIST_SIZE)];
					case 16:
						_e.sent();
						vidInfo = playlist.videos;
						vidInfo.slice(0, MAX_PLAYLIST_SIZE + 1).forEach(function (video) {
							var song = {
								title: he.decode(video.title),
								url: video.url,
								thumbUrl: video.thumbnails[video.thumbnails.length - 1].url,
								duration: video.durationInSec,
							};
							videos.push(song);
						});
						if (message) {
							searching.delete().catch(console.error);
						}
						return [3 /*break*/, 18];
					case 17:
						error_1 = _e.sent();
						console.error(error_1);
						if (message) {
							searching.delete().catch(console.error);
						}
						return [
							2 /*return*/,
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('playlist.errorNotFoundPlaylist'),
								ephemeral: true,
							}),
						];
					case 18:
						return [3 /*break*/, 31];
					case 19:
						if (!(isSpotify === 'playlist' || isSpotify === 'album')) return [3 /*break*/, 30];
						_e.label = 20;
					case 20:
						_e.trys.push([20, 28, , 29]);
						return [4 /*yield*/, playdl.spotify(url)];
					case 21:
						playlist = _e.sent();
						return [4 /*yield*/, playlist.fetch(MAX_PLAYLIST_SIZE)];
					case 22:
						_e.sent();
						playlistTitle = playlist.name;
						return [4 /*yield*/, playlist.fetched_tracks.get('1')];
					case 23:
						tracks = _e.sent();
						if (tracks.length > MAX_PLAYLIST_SIZE) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__mf('playlist.maxSize', { maxSize: MAX_PLAYLIST_SIZE }),
								ephemeral: true,
							});
						}
						i_1 = 0;
						_e.label = 24;
					case 24:
						if (!(i_1 <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 20) && i_1 < tracks.length))
							return [3 /*break*/, 27];
						search = tracks[i_1].name + ' ' + tracks[i_1].artists[0].name;
						return [
							4 /*yield*/,
							youtube.searchVideos(search, 1, {
								part: 'snippet.title, snippet.maxRes, snippet.durationSeconds',
							}),
						];
					case 25:
						results = _e.sent();
						searchResult = results[0];
						if (!searchResult) return [3 /*break*/, 26];
						song = {
							title: he.decode(
								searchResult === null || searchResult === void 0
									? void 0
									: searchResult.title,
							),
							url: searchResult === null || searchResult === void 0 ? void 0 : searchResult.url,
							thumbUrl:
								searchResult === null || searchResult === void 0
									? void 0
									: searchResult.maxRes.url,
							duration:
								searchResult === null || searchResult === void 0
									? void 0
									: searchResult.durationInSec,
						};
						videos.push(song);
						_e.label = 26;
					case 26:
						i_1++;
						return [3 /*break*/, 24];
					case 27:
						if (message) {
							searching.delete().catch(console.error);
						}
						return [3 /*break*/, 29];
					case 28:
						error_2 = _e.sent();
						console.error(error_2);
						if (message) {
							searching.delete().catch(console.error);
						}
						return [
							2 /*return*/,
							reply({
								message: message,
								interaction: interaction,
								content: error_2.message,
								ephemeral: true,
							}),
						];
					case 29:
						return [3 /*break*/, 31];
					case 30:
						if (message) {
							searching.delete().catch(console.error);
						}
						reply({
							message: message,
							interaction: interaction,
							content: i18n.__('playlist.notPlaylist'),
							ephemeral: true,
						});
						return [2 /*return*/];
					case 31:
						// else {
						// 	try {
						// 		let [playlist] = await playdl.search(search, {
						// 			source: { youtube: 'playlist' },
						// 			limit: 1,
						// 		});
						// 		await playlist.all_videos();
						// 		for (
						// 			let i = 0;
						// 			i <= (MAX_PLAYLIST_SIZE ? MAX_PLAYLIST_SIZE : 100) && i < playlist.videos.length;
						// 			i++
						// 		) {
						// 			let video = playlist.videos[i];
						// 			let song = {
						// 				title: video.title,
						// 				url: video.url,
						// 				thumbUrl: video.thumbnails[search.thumbnails.length - 1].url,
						// 				duration: video.durationInSec,
						// 			};
						// 			videos.push(song);
						// 		}
						// 		if (message) {
						// 			searching.delete().catch(console.error);
						// 		}
						// 	} catch (error) {
						// 		if (message) {
						// 			searching.delete().catch(console.error);
						// 		}
						// 		console.error(error);
						// 		return reply({ message, interaction, content: error.message, ephemeral: true });
						// 	}
						// }
						if (serverQueue) {
							(_c = serverQueue.songs).push.apply(_c, videos);
							npMessage({
								message: message,
								interaction: interaction,
								npSong: serverQueue.songs[0],
								prefix: prefix,
							});
							followUp({
								message: message,
								interaction: interaction,
								content: i18n.__mf('playlist.queueAdded', {
									playlist: playlistTitle,
									author: i.member.id,
								}),
								ephemeral: false,
							});
						} else {
							(_d = queueConstruct.songs).push.apply(_d, videos);
						}
						if (!!serverQueue) return [3 /*break*/, 37];
						i.client.queue.set(i.guildId, queueConstruct);
						_e.label = 32;
					case 32:
						_e.trys.push([32, 35, , 37]);
						if (!!voice.getVoiceConnection(i.guildId)) return [3 /*break*/, 34];
						_b = queueConstruct;
						return [
							4 /*yield*/,
							voice.joinVoiceChannel({
								channelId: channel.id,
								guildId: channel.guildId,
								selfDeaf: true,
								adapterCreator: channel.guild.voiceAdapterCreator,
							}),
						];
					case 33:
						_b.connection = _e.sent();
						_e.label = 34;
					case 34:
						followUp({
							message: message,
							interaction: interaction,
							content: i18n.__mf('playlist.queueAdded', {
								playlist: playlistTitle,
								author: i.member.id,
							}),
							ephemeral: false,
						});
						play({
							song: queueConstruct.songs[0],
							message: message,
							interaction: interaction,
							prefix: prefix,
						});
						return [3 /*break*/, 37];
					case 35:
						error_3 = _e.sent();
						console.error(error_3);
						i.client.queue.delete(i.guildId);
						return [4 /*yield*/, queueConstruct.connection.destroy()];
					case 36:
						_e.sent();
						return [
							2 /*return*/,
							followUp({
								message: message,
								interaction: interaction,
								content: i18n.__('play.cantJoinChannel', { error: error_3 }),
								ephemeral: true,
							}),
						];
					case 37:
						return [2 /*return*/];
				}
			});
		});
	},
};
