"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const utils_1 = require("../../include/utils");
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
exports.default = {
    name: 'status',
    description: i18n_1.default.__('moderation.status.description'),
    category: 'moderation',
    ownerOnly: true,
    testOnly: utils_1.TESTING,
    slash: true,
    options: [
        {
            name: 'activity',
            description: i18n_1.default.__('moderation.status.activityDesc'),
            type: 'STRING',
            required: true,
            choices: [
                {
                    name: 'Playing',
                    value: 'PLAYING',
                },
                {
                    name: 'Watching',
                    value: 'WATCHING',
                },
                {
                    name: 'Streaming',
                    value: 'STREAMING',
                },
                {
                    name: 'Listening to',
                    value: 'LISTENING',
                },
                {
                    name: 'Competing in',
                    value: 'COMPETING',
                },
            ],
        },
        {
            name: 'status',
            description: i18n_1.default.__('moderation.status.statusDesc'),
            type: 'STRING',
            required: true,
        },
        {
            name: 'url',
            description: i18n_1.default.__('moderation.status.urlDesc'),
            type: 'STRING',
            required: false,
        },
    ],
    async callback({ interaction, args, client }) {
        await interaction.deferReply({ ephemeral: true });
        const [activity, status, url] = args;
        try {
            if (client.user == null) {
                throw new Error("Client#User doesn't exist");
            }
            if (url && activity !== 'STREAMING') {
                interaction.followUp({ content: i18n_1.default.__('moderation.status.noURL') });
            }
            switch (activity) {
                case 'PLAYING': {
                    client.user.setPresence({
                        activities: [{ name: status, type: activity }],
                    });
                    break;
                }
                case 'WATCHING': {
                    client.user.setPresence({
                        activities: [{ name: status, type: activity }],
                    });
                    break;
                }
                case 'STREAMING': {
                    client.user.setPresence({
                        activities: [{ name: status, type: activity, url }],
                    });
                    break;
                }
                case 'LISTENING': {
                    client.user.setPresence({
                        activities: [{ name: status, type: activity }],
                    });
                    break;
                }
                case 'COMPETING': {
                    client.user.setPresence({
                        activities: [{ name: status, type: activity }],
                    });
                    break;
                }
                default: {
                    throw new Error('Activity type does not exist');
                }
            }
        }
        catch (e) {
            interaction.editReply({
                content: i18n_1.default.__mf('moderation.status.error', { error: e }),
            });
            return;
        }
        interaction.editReply({ content: i18n_1.default.__('moderation.status.complete') });
        return;
    },
};
//# sourceMappingURL=status.js.map