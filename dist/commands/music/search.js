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
var YouTubeAPI = require('simple-youtube-api');
var _a = require(''.concat(__base, 'include/utils')),
	YOUTUBE_API_KEY = _a.YOUTUBE_API_KEY,
	LOCALE = _a.LOCALE;
var youtube = new YouTubeAPI(YOUTUBE_API_KEY);
var i18n = require('i18n');
var he = require('he');
var _b = require('discord.js'),
	MessageEmbed = _b.MessageEmbed,
	MessageButton = _b.MessageButton,
	MessageActionRow = _b.MessageActionRow;
var reply = require('../../include/responses').reply;
// i18n.setLocale(LOCALE);
/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').Message} Message
 */
module.exports = {
	name: 'search',
	category: 'music',
	description: i18n.__('search.description'),
	guildOnly: 'true',
	slash: true,
	options: [
		{
			name: 'search',
			description: 'The term to search for',
			type: 'STRING',
			required: true,
		},
	],
	/**
	 *
	 * @param {{ interaction: CommandInteraction, args: Array<String>}}
	 * @returns {undefined}
	 */
	callback: function (_a) {
		var _b;
		var interaction = _a.interaction,
			instance = _a.instance,
			args = _a.args,
			prefix = _a.prefix;
		return __awaiter(this, void 0, void 0, function () {
			var settings,
				userVc,
				serverQueue,
				search,
				resultsEmbed,
				results,
				searchEmbed,
				buttons,
				row,
				collector_1,
				error_1;
			var _c;
			var _this = this;
			return __generator(this, function (_d) {
				switch (_d.label) {
					case 0:
						return [4 /*yield*/, interaction.deferReply({ ephemeral: true })];
					case 1:
						_d.sent();
						return [4 /*yield*/, interaction.client.db.get(interaction.guildId)];
					case 2:
						settings = _d.sent();
						if (!(settings === null || settings === void 0 ? void 0 : settings.musicChannel)) {
							reply({
								interaction: interaction,
								content: i18n.__('common.noSetup'),
								ephemeral: true,
							});
							return [2 /*return*/];
						}
						return [
							4 /*yield*/,
							(_b = interaction.member.voice) === null || _b === void 0 ? void 0 : _b.channel,
						];
					case 3:
						userVc = _d.sent();
						serverQueue = interaction.client.queue.get(interaction.guildId);
						if (!!interaction.member.voice) return [3 /*break*/, 5];
						return [
							4 /*yield*/,
							reply({
								interaction: interaction,
								content: i18n.__('search.errorNotChannel'),
								ephemeral: true,
							}),
						];
					case 4:
						return [2 /*return*/, _d.sent()];
					case 5:
						if (!userVc) {
							reply({
								interaction: interaction,
								content: i18n.__('play.errorNotChannel'),
								ephemeral: true,
							});
							return [2 /*return*/];
						}
						if (serverQueue && userVc !== interaction.guild.me.voice.channel) {
							reply({
								interaction: interaction,
								content: i18n.__mf('play.errorNotInSameChannel', {
									user: interaction.client.user,
								}),
								ephemeral: true,
							});
							return [2 /*return*/];
						}
						search = args[0];
						resultsEmbed = new MessageEmbed()
							.setTitle(i18n.__('search.resultEmbedTtile'))
							.setDescription(i18n.__mf('search.resultEmbedDesc', { search: search }))
							.setColor('#F8AA2A');
						_d.label = 6;
					case 6:
						_d.trys.push([6, 11, , 12]);
						return [4 /*yield*/, youtube.searchVideos(search, 5)];
					case 7:
						results = _d.sent();
						results.map(function (video, index) {
							video.title = he.decode(video.title);
							resultsEmbed.addField(
								video.shortURL,
								''.concat(index + 1, '. ').concat(video.title),
							);
						});
						searchEmbed = new MessageEmbed().setTitle('Searching...').setColor('#F8AA2A');
						return [
							4 /*yield*/,
							interaction.editReply({ embeds: [searchEmbed], ephemeral: true }),
						];
					case 8:
						_d.sent();
						buttons = [
							new MessageButton().setCustomId('one').setLabel('1').setStyle('PRIMARY'),
							new MessageButton().setCustomId('two').setLabel('2').setStyle('PRIMARY'),
							new MessageButton().setCustomId('three').setLabel('3').setStyle('PRIMARY'),
							new MessageButton().setCustomId('four').setLabel('4').setStyle('PRIMARY'),
							new MessageButton().setCustomId('five').setLabel('5').setStyle('PRIMARY'),
						];
						row = (_c = new MessageActionRow()).addComponents.apply(_c, buttons);
						return [
							4 /*yield*/,
							interaction.editReply({
								embeds: [resultsEmbed],
								components: [row],
								ephemeral: true,
							}),
						];
					case 9:
						_d.sent();
						return [
							4 /*yield*/,
							interaction
								.fetchReply()
								.then(function (reply) {
									return reply.createMessageComponentCollector({
										time: 30000,
										componentType: 'BUTTON',
									});
								})
								.catch(console.error),
						];
					case 10:
						collector_1 = _d.sent();
						collector_1.on('collect', function (i) {
							return __awaiter(_this, void 0, void 0, function () {
								var choice, choice, choice, choice, choice;
								return __generator(this, function (_a) {
									switch (_a.label) {
										case 0:
											return [4 /*yield*/, i.deferReply({ ephemeral: true })];
										case 1:
											_a.sent();
											switch (i.customId) {
												case 'one': {
													choice = resultsEmbed.fields[0].name;
													instance.commandHandler
														.getCommand('play')
														.callback({
															interaction: i,
															args: [choice],
															prefix: prefix,
														});
													collector_1.stop('choiceMade');
													break;
												}
												case 'two': {
													choice = resultsEmbed.fields[1].name;
													instance.commandHandler
														.getCommand('play')
														.callback({
															interaction: i,
															args: [choice],
															prefix: prefix,
														});
													collector_1.stop('choiceMade');
													break;
												}
												case 'three': {
													choice = resultsEmbed.fields[2].name;
													instance.commandHandler
														.getCommand('play')
														.callback({
															interaction: i,
															args: [choice],
															prefix: prefix,
														});
													collector_1.stop('choiceMade');
													break;
												}
												case 'four': {
													choice = resultsEmbed.fields[3].name;
													instance.commandHandler
														.getCommand('play')
														.callback({
															interaction: i,
															args: [choice],
															prefix: prefix,
														});
													collector_1.stop('choiceMade');
													break;
												}
												case 'five': {
													choice = resultsEmbed.fields[4].name;
													instance.commandHandler
														.getCommand('play')
														.callback({
															interaction: i,
															args: [choice],
															prefix: prefix,
														});
													collector_1.stop('choiceMade');
													break;
												}
											}
											return [2 /*return*/];
									}
								});
							});
						});
						collector_1.on('end', function (_, reason) {
							if (reason === 'time') {
								interaction.editReply({
									content: i18n.__('search.timeout'),
									ephemeral: true,
									embeds: [],
									components: [],
								});
							}
						});
						return [3 /*break*/, 12];
					case 11:
						error_1 = _d.sent();
						console.error(error_1);
						return [3 /*break*/, 12];
					case 12:
						return [2 /*return*/];
				}
			});
		});
	},
};
