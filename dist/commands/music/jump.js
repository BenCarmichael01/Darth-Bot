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
var i18n = require('i18n');
var reply = require('../../include/responses').reply;
// i18n.setLocale(LOCALE);
/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').Message} Message
 */
module.exports = {
	name: 'jump',
	category: 'music',
	description: i18n.__('jump.description'),
	guildOnly: 'true',
	slash: true,
	options: [
		{
			name: 'number',
			description: 'Queue number to skip to',
			type: 'INTEGER',
			minValue: 0,
			required: true,
		},
	],
	/**
	 *
	 * @param {{interaction: CommandInteraction, args: Array<Strings> }}
	 * @returns
	 */
	callback: function (_a) {
		var interaction = _a.interaction,
			args = _a.args;
		return __awaiter(this, void 0, void 0, function () {
			var queue, i;
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						return [4 /*yield*/, interaction.deferReply({ ephemeral: true })];
					case 1:
						_b.sent();
						queue = interaction.client.queue.get(interaction.guildId);
						if (!queue)
							return [
								2 /*return*/,
								reply({
									interaction: interaction,
									content: i18n.__('jump.errorNotQueue'),
									ephemeral: true,
								}),
							];
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
						if (args[0] > queue.songs.length) {
							return [
								2 /*return*/,
								reply({
									interaction: interaction,
									content: i18n.__mf('jump.errorNotValid', {
										length: queue.songs.length,
									}),
									ephemeral: true,
								}),
							];
						}
						queue.playing = true;
						if (queue.loop) {
							for (i = 0; i < args[0]; i++) {
								queue.songs.push(queue.songs.shift());
							}
						} else {
							queue.songs = queue.songs.slice(args[0]);
						}
						queue.player.emit('jump');
						reply({
							interaction: interaction,
							content: i18n.__mf('jump.success', { track: args[0] }),
						});
						queue.textChannel
							.send(
								i18n.__mf('jump.result', {
									author: interaction.member.id,
									arg: args[0] - 1,
								}),
							)
							.then(function (msg) {
								setTimeout(function () {
									msg.delete().catch(console.error);
								}, MSGTIMEOUT);
							})
							.catch(console.error);
						return [2 /*return*/];
				}
			});
		});
	},
};
