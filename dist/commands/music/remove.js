"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("../../include/utils");
const npmessage_1 = require("../../include/npmessage");
const responses_1 = require("../../include/responses");
const discord_js_1 = require("discord.js");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
exports.default = {
    name: 'remove',
    category: 'music',
    description: i18n_1.default.__('remove.description'),
    guildOnly: true,
    testOnly: utils_1.TESTING,
    slash: true,
    options: [
        {
            name: 'firstsong',
            description: i18n_1.default.__('remove.optionDescription'),
            type: discord_js_1.Constants.ApplicationCommandOptionTypes.INTEGER,
            required: true,
        },
        {
            name: 'secondsong',
            description: i18n_1.default.__('remove.optionDescription'),
            type: discord_js_1.Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false,
        },
        {
            name: 'thirdsong',
            description: i18n_1.default.__('remove.optionDescription'),
            type: discord_js_1.Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false,
        },
    ],
    async callback({ interaction, args, }) {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.guild)
            return;
        const queue = interaction.client.queue.get(interaction.guild.id);
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
        if (!queue) {
            return (0, responses_1.reply)({ interaction, content: i18n_1.default.__('remove.errorNotQueue'), ephemeral: true });
        }
        const songs = args.map((arg) => parseInt(arg, 10));
        const removed = [];
        queue.songs = queue.songs.filter((item, index) => {
            if (songs.find((songIndex) => songIndex === index)) {
                removed.push(item);
                return false;
            }
            return true;
        });
        (0, npmessage_1.npMessage)({ interaction, npSong: queue.songs[0] });
        await (0, responses_1.reply)({ interaction, content: 'Successfully removed song(s)', ephemeral: true });
        (0, responses_1.followUp)({
            interaction,
            content: `<@${member.id}> ❌ removed: \n- **${removed
                .map((song) => song.title)
                .join('\n- ')}** \nfrom the queue.`,
            ephemeral: false,
        });
    },
};
//# sourceMappingURL=remove.js.map