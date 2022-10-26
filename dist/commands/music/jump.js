"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("../../include/utils");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const responses_1 = require("../../include/responses");
const discord_js_1 = require("discord.js");
const play_1 = require("../../include/play");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
exports.default = {
    name: 'jump',
    category: 'music',
    description: i18n_1.default.__('jump.description'),
    guildOnly: true,
    testOnly: utils_1.TESTING,
    slash: true,
    options: [
        {
            name: 'number',
            description: 'Queue number to skip to',
            type: discord_js_1.Constants.ApplicationCommandOptionTypes.INTEGER,
            minValue: 1,
            required: true,
        },
    ],
    async callback({ interaction, args }) {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.guild)
            return;
        const queue = interaction.client.queue.get(interaction.guild.id);
        if (!queue) {
            (0, responses_1.reply)({
                interaction,
                content: i18n_1.default.__('jump.errorNotQueue'),
                ephemeral: true,
            });
            return;
        }
        if (interaction.member) {
            var member = interaction.member;
        }
        else {
            (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
            return;
        }
        if (!(0, utils_1.canModifyQueue)(member)) {
            return (0, responses_1.reply)({
                interaction,
                content: i18n_1.default.__('common.errorNotChannel'),
                ephemeral: true,
            });
        }
        if (parseInt(args[0]) > queue.songs.length) {
            return (0, responses_1.reply)({
                interaction,
                content: i18n_1.default.__mf('jump.errorNotValid', {
                    length: queue.songs.length,
                }),
                ephemeral: true,
            });
        }
        queue.playing = true;
        if (queue.loop) {
            for (let i = 0; i < parseInt(args[0]); i++) {
                queue.songs.push(queue.songs.shift());
            }
        }
        else {
            queue.songs = queue.songs.slice(parseInt(args[0]));
        }
        if (queue.player && queue.connection) {
            queue.collector.stop('skipSong');
            queue.connection.removeAllListeners();
            queue.player.removeAllListeners();
            queue.player.stop();
            (0, play_1.play)({
                song: queue.songs[0],
                interaction,
            });
        }
        (0, responses_1.reply)({
            interaction,
            content: i18n_1.default.__mf('jump.success', { track: args[0] }),
            ephemeral: true,
        });
        queue.textChannel
            .send(i18n_1.default.__mf('jump.result', {
            author: member.id,
            arg: parseInt(args[0]) - 1,
        }))
            .then((msg) => {
            setTimeout(() => {
                msg.delete().catch(console.error);
            }, utils_1.MSGTIMEOUT);
        })
            .catch(console.error);
    },
};
//# sourceMappingURL=jump.js.map