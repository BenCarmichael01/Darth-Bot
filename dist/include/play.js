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
var playdl = require('play-dl');
var npMessage = require('./npmessage').npMessage;
var _a = require(''.concat(__base, 'include/utils')),
	canModifyQueue = _a.canModifyQueue,
	STAY_TIME = _a.STAY_TIME,
	LOCALE = _a.LOCALE,
	MSGTIMEOUT = _a.MSGTIMEOUT;
var followUp = require('./responses').followUp;
var i18n = require('i18n');
var voice = require('@discordjs/voice');
var MessageButton = require('discord.js').MessageButton;
// i18n.setLocale(LOCALE);
/**
 *
 * @param {object} queue
 * @returns {DiscordAudioResource} DiscordAudioResource of the first song in the queue
 */
function getResource(queue) {
	return __awaiter(this, void 0, void 0, function () {
		var song, source, error_1, resource;
		return __generator(this, function (_a) {
			switch (_a.label) {
				case 0:
					song = queue.songs[0];
					source = null;
					if (!(song === null || song === void 0 ? void 0 : song.url.includes('youtube.com')))
						return [3 /*break*/, 4];
					_a.label = 1;
				case 1:
					_a.trys.push([1, 3, , 4]);
					return [
						4 /*yield*/,
						playdl.stream(song.url, {
							discordPlayerCompatibility: false,
						}),
					];
				case 2:
					source = _a.sent();
					return [3 /*break*/, 4];
				case 3:
					error_1 = _a.sent();
					console.error(error_1);
					return [2 /*return*/, false];
				case 4:
					resource = voice.createAudioResource(source.stream, {
						inputType: source.type,
					});
					return [2 /*return*/, resource];
			}
		});
	});
}
module.exports = {
	/**
	 * @name play
	 * @param {*} song
	 * @param {DiscordMessage} message
	 * @param {String} prefix
	 * @returns undefined
	 */
	play: function (_a) {
		var song = _a.song,
			message = _a.message,
			interaction = _a.interaction,
			prefix = _a.prefix;
		return __awaiter(this, void 0, void 0, function () {
			var i,
				queue,
				connection,
				VoiceConnectionStatus,
				AudioPlayerStatus,
				attempts,
				resource,
				player,
				_b,
				npmessage,
				collector;
			var _this = this;
			return __generator(this, function (_c) {
				switch (_c.label) {
					case 0:
						if (!!message) return [3 /*break*/, 3];
						i = interaction;
						if (!(!interaction.deferred && !interaction.replied)) return [3 /*break*/, 2];
						return [4 /*yield*/, interaction.deferReply({ ephemeral: false })];
					case 1:
						_c.sent();
						_c.label = 2;
					case 2:
						return [3 /*break*/, 4];
					case 3:
						if (!interaction) {
							i = message;
						}
						_c.label = 4;
					case 4:
						queue = i.client.queue.get(i.guildId);
						connection = voice.getVoiceConnection(i.guildId);
						(VoiceConnectionStatus = voice.VoiceConnectionStatus),
							(AudioPlayerStatus = voice.AudioPlayerStatus);
						if (!queue) return [2 /*return*/];
						attempts = 0;
						resource = {};
						_c.label = 5;
					case 5:
						if (
							!!(
								(queue === null || queue === void 0 ? void 0 : queue.songs.length) < 1 ||
								attempts >= 5
							)
						)
							return [3 /*break*/, 7];
						return [4 /*yield*/, getResource(queue)];
					case 6:
						resource = _c.sent();
						if (resource) {
							return [3 /*break*/, 7];
						} else {
							attempts++;
							queue.songs.shift();
							followUp({
								message: message,
								interaction: interaction,
								content: i18n.__mf('play.queueError'),
								ephemeral: true,
							});
						}
						return [3 /*break*/, 5];
					case 7:
						if (!resource) {
							return [
								2 /*return*/,
								followUp({
									message: message,
									interaction: interaction,
									content: i18n.__mf('play.queueFail'),
									ephemeral: true,
								}),
							];
						}
						player = voice.createAudioPlayer({
							behaviors: { noSubscriber: voice.NoSubscriberBehavior.Pause },
						});
						queue.player = player;
						/*-----------------Event Listeners-------------------------*/
						player.on('error', function (error) {
							console.error('Error: '.concat(error.message, ' with resource'));
						});
						// pass stream to audio player
						try {
							player.play(resource);
						} catch (error) {
							console.error(error);
						}
						connection.subscribe(player);
						return [
							4 /*yield*/,
							npMessage({
								message: message,
								interaction: interaction,
								npSong: song,
								prefix: prefix,
							}),
						];
					case 8:
						(_b = _c.sent()), (npmessage = _b[0]), (collector = _b[1]);
						collector.on('collect', function (int) {
							return __awaiter(_this, void 0, void 0, function () {
								var member, name, queue, _a, last, oldRow, i_1, songs, i_2, j;
								var _b;
								var _c;
								return __generator(this, function (_d) {
									switch (_d.label) {
										case 0:
											return [4 /*yield*/, int.deferReply()];
										case 1:
											_d.sent();
											member = int.member;
											name = member.id;
											return [4 /*yield*/, int.client.queue.get(int.guildId)];
										case 2:
											queue = _d.sent();
											_a = int.customId;
											switch (_a) {
												case 'playpause':
													return [3 /*break*/, 3];
												case 'skip':
													return [3 /*break*/, 4];
												case 'loop':
													return [3 /*break*/, 8];
												case 'shuffle':
													return [3 /*break*/, 9];
												case 'stop':
													return [3 /*break*/, 10];
											}
											return [3 /*break*/, 11];
										case 3:
											{
												if (!canModifyQueue(member)) {
													return [
														2 /*return*/,
														int
															.editReply({
																content: i18n.__('common.errorNotChannel'),
															})
															.then(function (reply) {
																setTimeout(function () {
																	return reply
																		.delete()
																		.catch(console.error);
																}, MSGTIMEOUT);
															})
															.catch(console.error),
													];
												}
												if (queue.playing) {
													queue.playing = false;
													player.pause();
													int.editReply({
														content: i18n.__mf('play.pauseSong', {
															author: name,
														}),
													}).then(function (reply) {
														setTimeout(function () {
															return reply.delete().catch(console.error);
														}, MSGTIMEOUT);
													});
												} else {
													queue.playing = true;
													player.unpause();
													int.editReply({
														content: i18n.__mf('play.resumeSong', {
															author: name,
														}),
													})
														.then(function (reply) {
															setTimeout(function () {
																return reply.delete().catch(console.error);
															}, MSGTIMEOUT);
														})
														.catch(console.error);
												}
												return [3 /*break*/, 11];
											}
											_d.label = 4;
										case 4:
											if (!canModifyQueue(member)) {
												return [
													2 /*return*/,
													int
														.editReply({
															content: i18n.__('common.errorNotChannel'),
														})
														.then(function (reply) {
															setTimeout(function () {
																return reply.delete().catch(console.error);
															}, MSGTIMEOUT);
														})
														.catch(console.error),
												];
											}
											int.editReply({
												content: i18n.__mf('play.skipSong', { author: name }),
											})
												.then(function (reply) {
													setTimeout(function () {
														return reply.delete().catch(console.error);
													}, MSGTIMEOUT);
												})
												.catch(console.error);
											if (queue.loop) {
												last = queue.songs.shift();
												queue.songs.push(last);
											} else {
												queue.songs.shift();
											}
											collector.stop('skipSong');
											connection.removeAllListeners();
											player.removeAllListeners();
											player.stop();
											if (!(queue.songs.length > 0)) return [3 /*break*/, 5];
											module.exports.play({
												song: queue.songs[0],
												message: message,
												interaction: int,
												prefix: prefix,
											});
											return [3 /*break*/, 7];
										case 5:
											return [
												4 /*yield*/,
												npMessage({
													message: message,
													interaction: int,
													prefix: prefix,
												}),
											];
										case 6:
											_d.sent();
											_d.label = 7;
										case 7:
											return [3 /*break*/, 11];
										case 8:
											{
												if (!canModifyQueue(member)) {
													return [
														2 /*return*/,
														int
															.editReply({
																content: i18n.__('common.errorNotChannel'),
															})
															.then(function (reply) {
																setTimeout(function () {
																	return reply
																		.delete()
																		.catch(console.error)
																		.catch(console.error);
																}, MSGTIMEOUT);
															})
															.catch(console.error),
													];
												}
												queue.loop = !queue.loop;
												oldRow = int.message.components[0];
												if (queue.loop) {
													int.component.setStyle('SUCCESS');
												} else {
													int.component.setStyle('SECONDARY');
												}
												for (i_1 = 0; i_1 < oldRow.components.length; i_1++) {
													if (oldRow.components[i_1].customId === 'loop') {
														oldRow.components[i_1] = int.component;
													}
												}
												int.message.edit({ components: [oldRow] });
												int.editReply({
													content: i18n.__mf('play.loopSong', {
														author: name,
														loop: queue.loop
															? i18n.__('common.on')
															: i18n.__('common.off'),
													}),
												})
													.then(function (reply) {
														setTimeout(function () {
															return reply.delete().catch(console.error);
														}, MSGTIMEOUT);
													})
													.catch(console.error);
												return [3 /*break*/, 11];
											}
											_d.label = 9;
										case 9:
											{
												if (!queue) {
													return [
														2 /*return*/,
														int
															.editReply({
																content: i18n.__('shuffle.errorNotQueue'),
															})
															.then(function (reply) {
																setTimeout(function () {
																	return reply
																		.delete()
																		.catch(console.error);
																}, MSGTIMEOUT);
															})
															.catch(console.error),
													];
												}
												if (!canModifyQueue(member)) {
													return [
														2 /*return*/,
														int
															.editReply({
																content: i18n.__('common.errorNotChannel'),
															})
															.then(function (reply) {
																setTimeout(function () {
																	return reply
																		.delete()
																		.catch(console.error);
																}, MSGTIMEOUT);
															})
															.catch(console.error),
													];
												}
												songs = queue.songs;
												for (i_2 = songs.length - 1; i_2 > 1; i_2--) {
													j = 1 + Math.floor(Math.random() * i_2);
													(_b = [songs[j], songs[i_2]]),
														(songs[i_2] = _b[0]),
														(songs[j] = _b[1]);
												}
												queue.songs = songs;
												int.client.queue.set(int.guildId, queue);
												npMessage({ interaction: int, npSong: song, prefix: prefix });
												int.editReply({
													content: i18n.__mf('shuffle.result', {
														author: name,
													}),
												})
													.then(function (reply) {
														setTimeout(function () {
															return reply.delete().catch(console.error);
														}, MSGTIMEOUT);
													})
													.catch(console.error);
												return [3 /*break*/, 11];
											}
											_d.label = 10;
										case 10:
											{
												if (!member.permissions.has('ADMINISTRATOR')) {
													if (!canModifyQueue(member)) {
														return [
															2 /*return*/,
															int
																.editReply({
																	content:
																		i18n.__('common.errorNotChannel'),
																})
																.then(function (reply) {
																	setTimeout(function () {
																		return reply
																			.delete()
																			.catch(console.error);
																	}, MSGTIMEOUT);
																})
																.catch(console.error),
														];
													}
												}
												int.editReply({
													content: i18n.__mf('play.stopSong', { author: name }),
												})
													.then(function (reply) {
														setTimeout(function () {
															return reply.delete().catch(console.error);
														}, MSGTIMEOUT);
													})
													.catch(console.error);
												try {
													player.emit('queueEnd');
													player.stop();
													npMessage({
														message: message,
														interaction: int,
														prefix: prefix,
													});
												} catch (error) {
													console.error(error);
													if (
														((_c =
															connection === null || connection === void 0
																? void 0
																: connection.state) === null || _c === void 0
															? void 0
															: _c.status) !== VoiceConnectionStatus.Destroyed
													) {
														connection.destroy();
													}
												}
												return [3 /*break*/, 11];
											}
											_d.label = 11;
										case 11:
											return [2 /*return*/];
									}
								});
							});
						});
						connection.on('setup', function () {
							try {
								player.stop();
							} catch (error) {
								console.error(error);
							}
							connection.destroy();
							i.client.queue.delete(i.guildId);
						});
						// Check if disconnect is real or is moving to another channel
						connection.on(VoiceConnectionStatus.Disconnected, function () {
							return __awaiter(_this, void 0, void 0, function () {
								var error_2;
								var _a;
								return __generator(this, function (_b) {
									switch (_b.label) {
										case 0:
											_b.trys.push([0, 2, , 3]);
											return [
												4 /*yield*/,
												Promise.race([
													voice.entersState(
														connection,
														VoiceConnectionStatus.Signalling,
														5000,
													),
													voice.entersState(
														connection,
														VoiceConnectionStatus.Connecting,
														5000,
													),
												]),
											];
										case 1:
											_b.sent();
											return [3 /*break*/, 3];
										case 2:
											error_2 = _b.sent();
											// Seems to be a real disconnect which SHOULDN'T be recovered from
											if (
												((_a =
													connection === null || connection === void 0
														? void 0
														: connection.state) === null || _a === void 0
													? void 0
													: _a.status) !== VoiceConnectionStatus.Destroyed
											) {
												connection.destroy();
											}
											i.client.queue.delete(i.guildId);
											return [3 /*break*/, 3];
										case 3:
											return [2 /*return*/];
									}
								});
							});
						});
						player.on('queueEnd', function () {
							i.client.queue.delete(i.guildId);
							var oldRow = npmessage.components[0];
							for (var i_3 = 0; i_3 < oldRow.components.length; i_3++) {
								if (oldRow.components[i_3].customId === 'loop') {
									oldRow.components[i_3] = new MessageButton()
										.setCustomId('loop')
										.setEmoji('🔁')
										.setStyle('SECONDARY');
								}
							}
							npmessage.edit({ components: [oldRow] });
						});
						player.on('jump', function () {
							var queue = i.client.queue.get(i.guildId);
							collector.stop('skipSong');
							connection.removeAllListeners();
							player.removeAllListeners();
							player.stop();
							module.exports.play({
								song: queue.songs[0],
								message: message,
								interaction: interaction,
								prefix: prefix,
							});
						});
						player.on(AudioPlayerStatus.Idle, function () {
							return __awaiter(_this, void 0, void 0, function () {
								var error_3, lastSong;
								return __generator(this, function (_a) {
									switch (_a.label) {
										case 0:
											_a.trys.push([0, 2, , 3]);
											return [
												4 /*yield*/,
												Promise.race([
													voice.entersState(
														player,
														AudioPlayerStatus.Playing,
														1000,
													),
													voice.entersState(
														player,
														AudioPlayerStatus.Buffering,
														1000,
													),
													voice.entersState(player, AudioPlayerStatus.Paused, 1000),
												]),
											];
										case 1:
											_a.sent();
											return [3 /*break*/, 3];
										case 2:
											error_3 = _a.sent();
											// apears to be finished current song
											// decide what to do:
											if (!queue) {
												npMessage({
													message: message,
													interaction: interaction,
													prefix: prefix,
												});
												return [
													2 /*return*/,
													setTimeout(function () {
														if (
															(queue === null || queue === void 0
																? void 0
																: queue.songs.length) >= 1
														) {
															module.exports.play({
																song: queue.songs[0],
																message: message,
																interaction: interaction,
																prefix: prefix,
															});
															return;
														}
														player.emit('queueEnd');
														connection === null || connection === void 0
															? void 0
															: connection.destroy();
														followUp({
															message: message,
															interaction: interaction,
															content:
																i18n.__('play.queueEnded') +
																'\n' +
																i18n.__('play.leaveChannel'),
															ephemeral: false,
														});
														return;
													}, STAY_TIME * 1000),
												];
											}
											if (
												queue.songs.length > 1 &&
												!(queue === null || queue === void 0 ? void 0 : queue.loop)
											) {
												// songs in queue and queue not looped so play next song
												queue.songs.shift();
												module.exports.play({
													song: queue.songs[0],
													message: message,
													interaction: interaction,
													prefix: prefix,
												});
											} else if (queue.songs.length >= 1 && queue.loop) {
												lastSong = queue.songs.shift();
												queue.songs.push(lastSong);
												module.exports.play({
													song: queue.songs[0],
													message: message,
													interaction: interaction,
													prefix: prefix,
												});
											} else if (queue.songs.length === 1 && !queue.loop) {
												// If there are no more songs in the queue then wait for STAY_TIME before leaving vc
												// unless a song was added during the timeout
												npMessage({ message: message, interaction: interaction });
												queue.songs.shift();
												setTimeout(function () {
													if (queue.songs.length >= 1) {
														module.exports.play({
															song: queue.songs[0],
															message: message,
															interaction: interaction,
															prefix: prefix,
														});
														return;
													}
													player.emit('queueEnd');
													connection === null || connection === void 0
														? void 0
														: connection.destroy();
													followUp({
														message: message,
														interaction: interaction,
														content:
															i18n.__('play.queueEnded') +
															'\n' +
															i18n.__('play.leaveChannel'),
														ephemeral: false,
													});
													return i.client.queue.delete(i.guildId);
												}, STAY_TIME * 1000);
											}
											// must remove these listeners before we call play function again to avoid memory leak and maxListeners exceeded error
											connection === null || connection === void 0
												? void 0
												: connection.removeAllListeners();
											// stop for same reason as connection above
											if (collector && !collector.ended) {
												collector.stop(['idleQueue']);
											}
											return [3 /*break*/, 3];
										case 3:
											return [2 /*return*/];
									}
								});
							});
						});
						// player only autopauses when not subscribed to a channel so this listener checks if the player is actually moving to another resource
						// or if the voice connection has been destroyed.
						// Cleans up after destroying connection and player
						player.on(AudioPlayerStatus.AutoPaused, function () {
							return __awaiter(_this, void 0, void 0, function () {
								var error_4;
								var _a;
								return __generator(this, function (_b) {
									switch (_b.label) {
										case 0:
											_b.trys.push([0, 2, , 3]);
											return [
												4 /*yield*/,
												Promise.race([
													voice.entersState(
														player,
														AudioPlayerStatus.Playing,
														5000,
													),
													voice.entersState(
														player,
														AudioPlayerStatus.Buffering,
														5000,
													),
													voice.entersState(player, AudioPlayerStatus.Paused, 5000),
												]),
											];
										case 1:
											_b.sent();
											return [3 /*break*/, 3];
										case 2:
											error_4 = _b.sent();
											//
											try {
												if (
													((_a =
														connection === null || connection === void 0
															? void 0
															: connection.state) === null || _a === void 0
														? void 0
														: _a.status) !== VoiceConnectionStatus.Destroyed
												) {
													connection.destroy();
													throw new Error('Test Error');
												}
												if (player) {
													player.emit('queueEnd');
													player.stop();
												}
											} finally {
												followUp({
													message: message,
													interaction: interaction,
													content:
														i18n.__('play.queueEnded') +
														'\n' +
														i18n.__('play.leaveChannel'),
													ephemeral: false,
												});
												i.client.queue.delete(i.guildId);
												npMessage({
													message: message,
													interaction: interaction,
													prefix: prefix,
												});
											}
											return [3 /*break*/, 3];
										case 3:
											return [2 /*return*/];
									}
								});
							});
						});
						i.client.on('voiceStateUpdate', function (oldState, newState) {
							if (newState.member.user.bot) return;
							if (
								oldState.channelId === queue.connection.joinConfig.channelId &&
								!newState.channelId
							) {
								setTimeout(function () {
									if (oldState.channel.members.size > 1) return;
									i.client.queue.delete(i.guildId);
									player.emit('queueEnd');
									player.removeAllListeners();
									player.stop();
									connection === null || connection === void 0
										? void 0
										: connection.destroy();
									npMessage({ message: message, interaction: interaction });
									followUp({
										message: message,
										interaction: interaction,
										content:
											i18n.__('play.queueEnded') + '\n' + i18n.__('play.leaveChannel'),
										ephemeral: false,
									});
									return;
								}, STAY_TIME * 1000);
							}
						});
						return [2 /*return*/];
				}
			});
		});
	},
};
