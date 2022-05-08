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
var i18n = require('i18n');
var MessageEmbed = require('discord.js').MessageEmbed;
var LOCALE = require(''.concat(__base, 'include/utils')).LOCALE;
var findById = require(''.concat(__base, '/include/findById')).findById;
// i18n.setLocale(LOCALE);
// TODO update npmessage when prefix is changed
module.exports = {
	/**
	 *
	 * @param {object} args
	 * @param {DiscordClient} args.client
	 * @param {DiscordMessage} args.message
	 * @param {object} args.npSong
	 * @param {String} args.guildIdParam
	 * @param {String} args.prefix
	 * @param {DiscordInteraction} args.interaction
	 * @returns {[DiscordMessage, MessageReactionCollector]} An array where the first item is the sent message object and the second is the reaction collector
	 */
	npMessage: function (_a) {
		var _b, _c;
		var client = _a.client,
			npSong = _a.npSong,
			guildIdParam = _a.guildIdParam,
			interaction = _a.interaction,
			message = _a.message;
		return __awaiter(this, void 0, void 0, function () {
			var i,
				guildId,
				settings,
				MUSIC_CHANNEL_ID,
				playingMessageId,
				musicChannel,
				queue,
				outputQueue,
				songsQueue,
				displayQueue,
				index,
				i_1,
				overflow,
				newEmbed,
				output1;
			var _this = this;
			return __generator(this, function (_d) {
				switch (_d.label) {
					case 0:
						if (!message && interaction && !guildIdParam) {
							i = interaction;
						} else if (message) {
							i = message;
						} else {
							i = undefined;
						}
						guildId = guildIdParam ? guildIdParam : i.guildId;
						return [4 /*yield*/, findById(guildId)];
					case 1:
						settings = _d.sent();
						MUSIC_CHANNEL_ID = settings.musicChannel;
						playingMessageId = settings.playingMessage;
						musicChannel = '';
						if (!(i === undefined)) return [3 /*break*/, 3];
						return [
							4 /*yield*/,
							(_b = client.guilds.cache.get(guildId)) === null || _b === void 0
								? void 0
								: _b.channels.cache.get(MUSIC_CHANNEL_ID),
						];
					case 2:
						musicChannel = _d.sent();
						if (!musicChannel) {
							return [2 /*return*/, []];
						}
						return [3 /*break*/, 5];
					case 3:
						return [4 /*yield*/, i.client.channels.cache.get(MUSIC_CHANNEL_ID)];
					case 4:
						musicChannel = _d.sent();
						_d.label = 5;
					case 5:
						queue = [];
						if (i !== undefined && npSong !== undefined) {
							queue =
								(_c = i.client.queue.get(i.guildId)) === null || _c === void 0
									? void 0
									: _c.songs;
						}
						outputQueue = i18n.__('npmessage.emptyQueue');
						songsQueue = '';
						if (queue) {
							displayQueue = queue.slice(1, 11);
							index = 0;
							for (i_1 = 0; i_1 < displayQueue.length; i_1++) {
								index = i_1 + 1;
								songsQueue = '**'
									.concat(index, '.** ')
									.concat(displayQueue[i_1].title, '\n ')
									.concat(songsQueue);
								if (
									i_1 === displayQueue.length - 1 &&
									queue.length - 1 > displayQueue.length
								) {
									overflow = queue.length - 1 - displayQueue.length;
									if (overflow === 1 && i_1 < displayQueue.length) {
										songsQueue = '**'
											.concat(index + 1, '.** ')
											.concat(queue[i_1 + 2].title, '\n ')
											.concat(songsQueue);
										break;
									} else if (overflow > 1) {
										songsQueue = i18n.__mf('npmessage.overflow', {
											overflow: overflow,
											songsQueue: songsQueue,
										});
										break;
									}
								}
							}
							outputQueue = i18n.__mf('npmessage.outputQueue', { songsQueue: songsQueue });
						}
						newEmbed = {};
						if (npSong === undefined) {
							newEmbed = new MessageEmbed()
								.setColor('#5865F2')
								.setTitle(i18n.__('npmessage.title'))
								.setURL('')
								.setImage('https://i.imgur.com/TObp4E6.jpg')
								.setFooter(i18n.__('npmessage.footer'));
						} else {
							newEmbed = new MessageEmbed()
								.setColor('#5865F2')
								.setTitle(i18n.__mf('npmessage.titleSong', { title: npSong.title }))
								.setURL(npSong.url)
								.setImage(npSong.thumbUrl)
								.setFooter(i18n.__('npmessage.footer'));
						}
						return [
							4 /*yield*/,
							musicChannel.messages
								.fetch({ limit: 10 })
								.then(function (messages) {
									return __awaiter(_this, void 0, void 0, function () {
										var outputArr, _a, _b;
										return __generator(this, function (_c) {
											switch (_c.label) {
												case 0:
													outputArr = [];
													_a = outputArr;
													_b = 0;
													return [4 /*yield*/, messages.get(playingMessageId)];
												case 1:
													_a[_b] = _c.sent();
													// Change now playing message to match current song
													outputArr[0].edit({
														content: outputQueue,
														embeds: [newEmbed],
													});
													// outputArr[0].edit({ content: outputQueue, embeds: [newEmbed] });
													return [2 /*return*/, outputArr];
											}
										});
									});
								})
								.then(function (outputArr) {
									return __awaiter(_this, void 0, void 0, function () {
										var outputVar;
										return __generator(this, function (_a) {
											outputVar = outputArr;
											outputVar[1] = outputArr[0].createMessageComponentCollector({
												componentType: 'BUTTON',
											});
											return [2 /*return*/, outputVar];
										});
									});
								})
								.catch(console.error),
						];
					case 6:
						output1 = _d.sent();
						return [2 /*return*/, output1];
				}
			});
		});
	},
};
