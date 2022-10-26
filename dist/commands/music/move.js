"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const utils_1 = require("../../include/utils");
const npmessage_1 = require("../../include/npmessage");
const responses_1 = require("../../include/responses");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
    return arr;
}
exports.default = {
    name: 'move',
    aliases: ['mv'],
    category: 'music',
    description: i18n_1.default.__('move.description'),
    guildOnly: true,
    testOnly: utils_1.TESTING,
    usage: i18n_1.default.__('move.usagesReply'),
    slash: true,
    options: [
        {
            name: 'from',
            description: i18n_1.default.__('move.fromDescription'),
            type: 'INTEGER',
            required: true,
        },
        {
            name: 'to',
            description: i18n_1.default.__('move.toDescription'),
            type: 'INTEGER',
            required: true,
        },
    ],
    async callback({ interaction, args, client, }) {
        try {
            await interaction.deferReply({ ephemeral: true });
            if (!interaction.guild) {
                (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
                return;
            }
            const queue = client.queue.get(interaction.guild.id);
            if (!queue) {
                return interaction.editReply({ content: i18n_1.default.__('move.errorNotQueue') });
            }
            if (interaction.member) {
                var member = interaction.member;
            }
            else {
                (0, responses_1.reply)({ interaction, content: i18n_1.default.__('common.unknownError'), ephemeral: true });
                return;
            }
            if (!(0, utils_1.canModifyQueue)(member))
                return;
            if (Number.isNaN(args[0]) || parseInt(args[0]) < 1) {
                return interaction.editReply({
                    content: i18n_1.default.__mf('move.usagesReply', { prefix: '/' }),
                });
            }
            const currentPos = parseInt(args[0]);
            const newPos = parseInt(args[1]);
            const song = queue.songs[newPos];
            if (currentPos > queue.songs.length - 1 || newPos > queue.songs.length - 1) {
                return interaction.editReply({ content: i18n_1.default.__('move.range') });
            }
            queue.songs = arraymove(queue.songs, currentPos, newPos);
            (0, npmessage_1.npMessage)({ interaction, npSong: queue.songs[0] });
            await interaction.editReply({ content: i18n_1.default.__('move.success') });
            (0, responses_1.followUp)({
                interaction,
                content: i18n_1.default.__mf('move.result', {
                    author: member.id,
                    title: song.title,
                    index: newPos,
                }),
            })
                .then((msg) => {
                setTimeout(() => {
                    if (msg) {
                        msg.delete();
                    }
                }, utils_1.MSGTIMEOUT);
            })
                .catch(console.error);
        }
        catch (error) {
            console.error(error);
            interaction
                .followUp({ content: i18n_1.default.__('common.unknownError'), ephemeral: true })
                .catch(console.error);
        }
    },
};
//# sourceMappingURL=move.js.map