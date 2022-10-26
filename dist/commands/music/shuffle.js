"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("../../include/utils");
const npmessage_1 = require("../../include/npmessage");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const responses_1 = require("../../include/responses");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
exports.default = {
    name: 'shuffle',
    category: 'music',
    description: i18n_1.default.__('shuffle.description'),
    guildOnly: true,
    testOnly: utils_1.TESTING,
    slash: true,
    async callback({ interaction }) {
        try {
            await interaction.deferReply({ ephemeral: true });
            if (typeof interaction.guildId === 'string') {
                var GUILDID = interaction.guildId;
            }
            else {
                return interaction.reply({ content: i18n_1.default.__('common.unknownError') });
            }
            const queue = interaction.client.queue.get(GUILDID);
            if (!queue) {
                return (0, responses_1.reply)({ interaction, content: i18n_1.default.__('shuffle.errorNotQueue'), ephemeral: true });
            }
            if ('member' in interaction) {
                var guildMember = interaction.member;
            }
            else {
                return interaction.reply({ content: i18n_1.default.__('common.unknownError') });
            }
            if (!(0, utils_1.canModifyQueue)(guildMember)) {
                return (0, responses_1.reply)({
                    interaction,
                    content: i18n_1.default.__('common.errorNotChannel'),
                    ephemeral: true,
                });
            }
            const { songs } = queue;
            for (let i = songs.length - 1; i > 1; i--) {
                const j = 1 + Math.floor(Math.random() * i);
                [songs[i], songs[j]] = [songs[j], songs[i]];
            }
            queue.songs = songs;
            interaction.client.queue.set(GUILDID, queue);
            (0, npmessage_1.npMessage)({ interaction, npSong: songs[0] });
            (0, responses_1.reply)({
                interaction,
                content: i18n_1.default.__('shuffle.success'),
                ephemeral: true,
            });
            queue.textChannel
                .send({
                content: i18n_1.default.__mf('shuffle.result', { author: guildMember.id }),
                ephemeral: false,
            })
                .then((msg) => {
                setTimeout(() => {
                    msg.delete().catch(console.error);
                }, utils_1.MSGTIMEOUT);
            })
                .catch(console.error);
            return;
        }
        catch (error) {
            console.error(error);
        }
    },
};
//# sourceMappingURL=shuffle.js.map