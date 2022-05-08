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
var _a = require(''.concat(__base, 'include/utils')),
	canModifyQueue = _a.canModifyQueue,
	LOCALE = _a.LOCALE,
	MSGTIMEOUT = _a.MSGTIMEOUT;
var npMessage = require(''.concat(__base, 'include/npmessage')).npMessage;
var i18n = require('i18n');
var reply = require('../../include/responses').reply;
// i18n.setLocale(LOCALE);
module.exports = {
	name: 'shuffle',
	category: 'music',
	description: i18n.__('shuffle.description'),
	guildOnly: true,
	slash: true,
	callback: function (_a) {
		var interaction = _a.interaction,
			prefix = _a.prefix;
		return __awaiter(this, void 0, void 0, function () {
			var queue, songs, i, j, error_1;
			var _b;
			return __generator(this, function (_c) {
				switch (_c.label) {
					case 0:
						_c.trys.push([0, 2, , 3]);
						return [4 /*yield*/, interaction.deferReply({ ephemeral: true })];
					case 1:
						_c.sent();
						queue = interaction.client.queue.get(interaction.guildId);
						if (!queue) {
							return [
								2 /*return*/,
								reply({
									interaction: interaction,
									content: i18n.__('shuffle.errorNotQueue'),
									ephemeral: true,
								}),
							];
						}
						if (!canModifyQueue(interaction.member)) {
							return [
								2 /*return*/,
								reply({
									interaction: interaction,
									content: i18n.__('common.errorNotChannel'),
									ephemeral: true,
								}),
							];
						}
						songs = queue.songs;
						for (i = songs.length - 1; i > 1; i--) {
							j = 1 + Math.floor(Math.random() * i);
							(_b = [songs[j], songs[i]]), (songs[i] = _b[0]), (songs[j] = _b[1]);
						}
						queue.songs = songs;
						interaction.client.queue.set(interaction.guildId, queue);
						npMessage({ interaction: interaction, npSong: songs[0], prefix: prefix });
						reply({
							interaction: interaction,
							content: i18n.__('shuffle.success'),
							ephemeral: true,
						});
						queue.textChannel
							.send({
								content: i18n.__mf('shuffle.result', { author: interaction.member.id }),
								ephemeral: false,
							})
							.then(function (msg) {
								setTimeout(function () {
									msg.delete().catch(console.error);
								}, MSGTIMEOUT);
							})
							.catch(console.error);
						return [2 /*return*/];
					case 2:
						error_1 = _c.sent();
						console.error(error_1);
						return [3 /*break*/, 3];
					case 3:
						return [2 /*return*/];
				}
			});
		});
	},
};
