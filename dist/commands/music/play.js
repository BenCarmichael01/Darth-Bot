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
var YouTubeAPI = require('simple-youtube-api');
var playdl = require('play-dl');
var i18n = require('i18n');
var voice = require('@discordjs/voice');
var he = require('he');
var npMessage = require(''.concat(__base, '/include/npmessage')).npMessage;
var _a = require('../../include/utils'),
	YOUTUBE_API_KEY = _a.YOUTUBE_API_KEY,
	LOCALE = _a.LOCALE,
	DEFAULT_VOLUME = _a.DEFAULT_VOLUME,
	MSGTIMEOUT = _a.MSGTIMEOUT;
var _b = require(''.concat(__base, 'include/responses')),
	reply = _b.reply,
	followUp = _b.followUp;
// i18n.setLocale(LOCALE);
var youtube = new YouTubeAPI(YOUTUBE_API_KEY);
module.exports = {
	name: 'play',
	category: 'music',
	description: i18n.__('play.description'),
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
		var _b;
		var message = _a.message,
			interaction = _a.interaction,
			args = _a.args,
			prefix = _a.prefix,
			instance = _a.instance;
		return __awaiter(this, void 0, void 0, function () {
			var i,
				settings,
				channelExists,
				userVc,
				channel,
				serverQueue,
				permissions,
				search,
				url,
				isSpotify,
				isYt,
				queueConstruct,
				songInfo,
				song,
				error_1,
				spot,
				search_1,
				results,
				searchResult,
				error_2,
				results,
				searchResult,
				error_3,
				error_4;
			var _c;
			return __generator(this, function (_d) {
				switch (_d.label) {
					case 0:
						if (!!message) return [3 /*break*/, 3];
						if (!(!interaction.deferred && !interaction.replied)) return [3 /*break*/, 2];
						return [4 /*yield*/, interaction.deferReply({ ephemeral: true })];
					case 1:
						_d.sent();
						_d.label = 2;
					case 2:
						i = interaction;
						i.isInteraction = true;
						return [3 /*break*/, 4];
					case 3:
						if (!interaction) {
							i = message;
							i.isInteraction = false;
						}
						_d.label = 4;
					case 4:
						return [4 /*yield*/, i.client.db.get(i.guildId)];
					case 5:
						settings = _d.sent();
						return [4 /*yield*/, i.guild.channels.fetch(settings.musicChannel)];
					case 6:
						channelExists = _d.sent();
						if (
							!(
								!(settings === null || settings === void 0
									? void 0
									: settings.musicChannel) || !channelExists
							)
						)
							return [3 /*break*/, 8];
						return [
							4 /*yield*/,
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('common.noSetup'),
								ephemeral: true,
							}),
						];
					case 7:
						_d.sent();
						message === null || message === void 0 ? void 0 : message.delete();
						return [2 /*return*/];
					case 8:
						return [
							4 /*yield*/,
							(_b = i.member.voice) === null || _b === void 0 ? void 0 : _b.channel,
						];
					case 9:
						userVc = _d.sent();
						return [4 /*yield*/, i.guild.me.voice.channel];
					case 10:
						channel = _d.sent();
						return [4 /*yield*/, i.client.queue.get(i.guildId)];
					case 11:
						serverQueue = _d.sent();
						if (!userVc) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('play.errorNotChannel'),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						if (serverQueue && userVc !== i.guild.me.voice.channel) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__mf('play.errorNotInSameChannel', {
									user: i.client.user,
								}),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						if (!args.length) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__mf('play.usageReply', { prefix: prefix }),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						permissions = userVc.permissionsFor(i.client.user);
						if (!permissions.has('CONNECT')) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('play.missingPermissionConnect'),
								ephemeral: true,
							});
							message === null || message === void 0 ? void 0 : message.delete();
							return [2 /*return*/];
						}
						if (!permissions.has('SPEAK')) {
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('play.missingPermissionSpeak'),
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
					case 12:
						_d.sent();
						if (!playdl.is_expired()) return [3 /*break*/, 14];
						return [4 /*yield*/, playdl.refreshToken()];
					case 13:
						_d.sent(); // This will check if access token has expired. If yes, then refresh the token.
						_d.label = 14;
					case 14:
						search = args.join(' ');
						url = args[0];
						isSpotify = playdl.sp_validate(url);
						isYt = playdl.yt_validate(url);
						//  Start the playlist if playlist url was provided
						if (isYt === 'playlist') {
							instance.commandHandler
								.getCommand('playlist')
								.callback({
									message: message,
									interaction: interaction,
									args: args,
									prefix: prefix,
								});
							return [2 /*return*/];
						}
						if (isSpotify === 'playlist' || isSpotify === 'album') {
							instance.commandHandler
								.getCommand('playlist')
								.callback({
									message: message,
									interaction: interaction,
									args: args,
									prefix: prefix,
								});
							return [2 /*return*/];
						}
						_c = {};
						return [4 /*yield*/, i.guild.channels.fetch(settings.musicChannel)];
					case 15:
						queueConstruct =
							((_c.textChannel = _d.sent()),
							(_c.channel = channel),
							(_c.connection = null),
							(_c.player = null),
							(_c.songs = []),
							(_c.loop = false),
							(_c.volume = DEFAULT_VOLUME || 100),
							(_c.playing = true),
							_c);
						songInfo = null;
						song = null;
						if (!(isYt === 'video' && url.startsWith('https'))) return [3 /*break*/, 20];
						_d.label = 16;
					case 16:
						_d.trys.push([16, 18, , 19]);
						return [4 /*yield*/, youtube.getVideo(url, { part: 'snippet' })];
					case 17:
						songInfo = _d.sent();
						song = {
							title: he.decode(songInfo.title),
							url: songInfo.url,
							thumbUrl: songInfo.maxRes.url,
							duration: songInfo.durationSeconds,
						};
						return [3 /*break*/, 19];
					case 18:
						error_1 = _d.sent();
						console.error(error_1);
						followUp({
							message: message,
							interaction: interaction,
							content: i18n.__mf('play.queueError', {
								error: error_1.message ? error_1.message : error_1,
							}),
						});
						return [2 /*return*/];
					case 19:
						return [3 /*break*/, 30];
					case 20:
						if (!(isSpotify === 'track')) return [3 /*break*/, 27];
						_d.label = 21;
					case 21:
						_d.trys.push([21, 25, , 26]);
						return [4 /*yield*/, playdl.spotify(url)];
					case 22:
						spot = _d.sent();
						if (!(spot.type === 'track')) return [3 /*break*/, 24];
						search_1 = spot.name + ' ' + spot.artists[0].name;
						return [
							4 /*yield*/,
							youtube.searchVideos(search_1, 1, {
								part: 'snippet',
							}),
						];
					case 23:
						results = _d.sent();
						searchResult = results[0];
						song = {
							title: he.decode(searchResult.title),
							url: searchResult.url,
							thumbUrl: searchResult.maxRes.url,
							duration: searchResult.durationSeconds,
						};
						_d.label = 24;
					case 24:
						return [3 /*break*/, 26];
					case 25:
						error_2 = _d.sent();
						console.error(error_2);
						followUp({
							message: message,
							interaction: interaction,
							content: i18n.__mf('play.queueError', {
								error: error_2.message ? error_2.message : error_2,
							}),
						});
						return [2 /*return*/];
					case 26:
						return [3 /*break*/, 30];
					case 27:
						_d.trys.push([27, 29, , 30]);
						return [
							4 /*yield*/,
							youtube.searchVideos(search, 1, {
								part: 'snippet',
							}),
						];
					case 28:
						results = _d.sent();
						searchResult = results[0];
						song = {
							title: he.decode(searchResult.title),
							url: searchResult.url,
							thumbUrl: searchResult.maxRes.url,
							duration: searchResult.durationSeconds,
						};
						return [3 /*break*/, 30];
					case 29:
						error_3 = _d.sent();
						console.error(error_3);
						followUp({
							message: message,
							interaction: interaction,
							content: i18n.__mf('play.queueError', {
								error: error_3.message ? error_3.message : error_3,
							}),
						});
						message ? message.delete() : null;
						return [2 /*return*/];
					case 30:
						if (
							!(
								(serverQueue === null || serverQueue === void 0
									? void 0
									: serverQueue.songs.length) > 0
							)
						)
							return [3 /*break*/, 32];
						serverQueue.songs.push(song);
						npMessage({
							interaction: interaction,
							message: message,
							npSong: serverQueue.songs[0],
							prefix: prefix,
						});
						return [
							4 /*yield*/,
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('play.success'),
								ephemeral: true,
							}),
						];
					case 31:
						_d.sent();
						message ? message.delete() : null;
						serverQueue.textChannel
							.send(
								i18n.__mf('play.queueAdded', {
									title: song.title,
									author: i.member.id,
								}),
							)
							.then(function (msg) {
								setTimeout(function () {
									return msg.delete();
								}, MSGTIMEOUT);
							})
							.catch(console.error);
						return [2 /*return*/];
					case 32:
						queueConstruct.songs.push(song);
						i.client.queue.set(i.guildId, queueConstruct);
						_d.label = 33;
					case 33:
						_d.trys.push([33, 35, , 37]);
						if (!voice.getVoiceConnection(i.guildId)) {
							queueConstruct.connection = voice.joinVoiceChannel({
								channelId: userVc.id,
								guildId: userVc.guildId,
								selfDeaf: true,
								adapterCreator: userVc.guild.voiceAdapterCreator,
							});
						}
						play({
							song: queueConstruct.songs[0],
							message: message,
							interaction: interaction,
							prefix: prefix,
						});
						return [
							4 /*yield*/,
							reply({
								message: message,
								interaction: interaction,
								content: i18n.__('play.success'),
								ephemeral: true,
							}),
						];
					case 34:
						_d.sent();
						message ? message.delete() : null;
						queueConstruct.textChannel
							.send({
								content: i18n.__mf('play.queueAdded', {
									title: queueConstruct.songs[0].title,
									author: i.member.id,
								}),
							})
							.then(function (msg) {
								setTimeout(function () {
									msg.delete().catch(console.error);
								}, MSGTIMEOUT);
							})
							.catch(console.error);
						return [3 /*break*/, 37];
					case 35:
						error_4 = _d.sent();
						console.error(error_4);
						i.client.queue.delete(i.guildId);
						return [4 /*yield*/, queueConstruct.connection.destroy()];
					case 36:
						_d.sent();
						followUp({
							message: message,
							interaction: interaction,
							content: i18n.__('play.cantJoinChannel', {
								error: error_4.message,
							}),
							ephemeral: true,
						});
						message ? message.delete() : null;
						return [2 /*return*/];
					case 37:
						return [2 /*return*/];
				}
			});
		});
	},
};
