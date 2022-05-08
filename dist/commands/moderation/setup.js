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
var _a = require('discord.js'),
	MessageEmbed = _a.MessageEmbed,
	MessageActionRow = _a.MessageActionRow,
	MessageButton = _a.MessageButton;
var LOCALE = require(''.concat(__base, 'include/utils')).LOCALE;
var findById = require(''.concat(__base, 'include/findById')).findById;
var upsert = require(''.concat(__base, 'include/upsert')).upsert;
var voice = require('@discordjs/voice');
// i18n.setLocale(LOCALE);
function isChannel(channelId, interaction) {
	var obj = interaction.guild.channels.cache.get(channelId);
	if (!obj || obj.type != 'GUILD_TEXT') return false;
	return true;
}
function runSetup(interaction, channelTag, client, guild) {
	return __awaiter(this, void 0, void 0, function () {
		var connections,
			musicChannel,
			outputQueue,
			newEmbed,
			buttons,
			row,
			playingMessage,
			collector,
			settings,
			MUSIC_CHANNEL_ID,
			_doc,
			error_1;
		var _a;
		return __generator(this, function (_b) {
			switch (_b.label) {
				case 0:
					return [
						4 /*yield*/,
						interaction.reply({
							content: i18n.__mf('moderation.setup.start', { channel: channelTag }),
							ephemeral: true,
							components: [],
						}),
					];
				case 1:
					_b.sent();
					return [4 /*yield*/, voice.getVoiceConnections()];
				case 2:
					connections = _b.sent();
					connections === null || connections === void 0
						? void 0
						: connections.forEach(function (connection) {
								var channel = connection.joinConfig.channelId;
								var guildId = client.channels.resolve(channel).guildId;
								if (guildId === interaction.guildId) {
									connection.emit('setup');
								}
						  });
					if (!isChannel(channelTag, interaction)) return [3 /*break*/, 13];
					_b.label = 3;
				case 3:
					_b.trys.push([3, 11, , 12]);
					musicChannel = interaction.guild.channels.cache.get(channelTag);
					// Delete existing messages in channel
					return [4 /*yield*/, musicChannel.bulkDelete(100, true)];
				case 4:
					// Delete existing messages in channel
					_b.sent();
					outputQueue = i18n.__('npmessage.emptyQueue');
					newEmbed = new MessageEmbed()
						.setColor('#5865F2')
						.setTitle(i18n.__('npmessage.title'))
						.setURL('')
						.setImage('https://i.imgur.com/TObp4E6.jpg')
						.setFooter(i18n.__('npmessage.footer'));
					buttons = [
						new MessageButton().setCustomId('playpause').setEmoji('⏯').setStyle('SECONDARY'),
						new MessageButton().setCustomId('skip').setEmoji('⏭').setStyle('SECONDARY'),
						new MessageButton().setCustomId('loop').setEmoji('🔁').setStyle('SECONDARY'),
						new MessageButton().setCustomId('shuffle').setEmoji('🔀').setStyle('SECONDARY'),
						new MessageButton().setCustomId('stop').setEmoji('⏹').setStyle('SECONDARY'),
					];
					row = (_a = new MessageActionRow()).addComponents.apply(_a, buttons);
					return [
						4 /*yield*/,
						musicChannel.send({
							content: outputQueue,
							embeds: [newEmbed],
							components: [row],
						}),
					];
				case 5:
					playingMessage = _b.sent();
					collector = playingMessage.createMessageComponentCollector({ componentType: 'BUTTON' });
					collector.on('collect', function (i) {
						if (!i.isButton()) return;
						var queue = client.queue.get(i.guildId); // .songs
						if (!queue) {
							i.reply({ content: i18n.__mf('nowplaying.errorNotQueue'), ephemeral: true });
						}
					});
					// updates/inserts musicChannel and playingMessage in db
					return [
						4 /*yield*/,
						upsert({
							_id: guild.id,
							musicChannel: musicChannel.id,
							playingMessage: playingMessage.id,
						}),
					];
				case 6:
					// updates/inserts musicChannel and playingMessage in db
					_b.sent();
					return [4 /*yield*/, findById(guild.id)];
				case 7:
					settings = _b.sent();
					MUSIC_CHANNEL_ID =
						settings === null || settings === void 0 ? void 0 : settings.musicChannel;
					if (!(MUSIC_CHANNEL_ID === channelTag)) return [3 /*break*/, 9];
					interaction.followUp({
						content: i18n.__mf('moderation.setup.success', {
							MUSIC_CHANNEL_ID: MUSIC_CHANNEL_ID,
						}),
						ephemeral: true,
					});
					_doc = settings._doc;
					delete _doc._id;
					delete _doc.__v;
					return [4 /*yield*/, client.db.set(guild.id, _doc)];
				case 8:
					_b.sent();
					return [3 /*break*/, 10];
				case 9:
					interaction.followUp({
						content: i18n.__mf('moderation.setup.fail'),
						ephemeral: true,
					});
					_b.label = 10;
				case 10:
					return [3 /*break*/, 12];
				case 11:
					error_1 = _b.sent();
					console.error(error_1);
					interaction.followUp({
						content: i18n.__('moderation.setup.error', { error: error_1.message }),
						ephemeral: true,
					});
					return [3 /*break*/, 12];
				case 12:
					return [3 /*break*/, 14];
				case 13:
					interaction.followUp({
						content: i18n.__('moderation.setup.notChannel'),
						ephemeral: true,
					});
					_b.label = 14;
				case 14:
					return [2 /*return*/];
			}
		});
	});
}
module.exports = {
	name: 'setup',
	category: 'moderation',
	description: i18n.__('moderation.setup.description'),
	guildOnly: true,
	slash: true,
	ownerOnly: true,
	options: [
		{
			name: 'channel',
			description: i18n.__('moderation.setup.optionDescription'),
			type: 'CHANNEL',
			channelTypes: ['GUILD_TEXT'],
			required: true,
		},
	],
	callback: function (_a) {
		var interaction = _a.interaction,
			args = _a.args,
			guild = _a.guild,
			client = _a.client;
		return __awaiter(this, void 0, void 0, function () {
			var channelTag, buttons, row, warning;
			var _b;
			return __generator(this, function (_c) {
				switch (_c.label) {
					case 0:
						channelTag = args[0];
						buttons = [
							new MessageButton()
								.setCustomId('yes')
								.setStyle('SUCCESS')
								.setLabel(i18n.__('moderation.setup.continue')),
							new MessageButton()
								.setCustomId('no')
								.setStyle('DANGER')
								.setLabel(i18n.__('moderation.setup.cancel')),
						];
						row = (_b = new MessageActionRow()).addComponents.apply(_b, buttons);
						return [
							4 /*yield*/,
							interaction.reply({
								content: i18n.__('moderation.setup.warning'),
								ephemeral: true,
								components: [row],
								fetchReply: true,
							}),
						];
					case 1:
						warning = _c.sent();
						warning
							.awaitMessageComponent({ componentType: 'BUTTON', time: 20000 })
							.then(function (i) {
								if (i.customId === 'yes') {
									runSetup(i, channelTag, client, guild);
								} else {
									i.reply({
										content: i18n.__('moderation.setup.cancelled'),
										ephemeral: true,
									});
								}
							})
							.catch(console.error);
						return [2 /*return*/];
				}
			});
		});
	},
};
