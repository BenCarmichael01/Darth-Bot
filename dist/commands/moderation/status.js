"use strict";
const i18n = require('i18n');
module.exports = {
    name: 'status',
    description: i18n.__('moderation.status.description'),
    category: 'moderation',
    ownerOnly: true,
    slash: true,
    options: [
        {
            name: 'activity',
            description: i18n.__('moderation.status.activityDesc'),
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
            description: i18n.__('moderation.status.statusDesc'),
            type: 'STRING',
            required: true,
        },
        {
            name: 'url',
            description: i18n.__('moderation.status.urlDesc'),
            type: 'STRING',
            required: false,
        },
    ],
    async callback({ interaction, args, client }) {
        const [type, name, url] = args;
        await interaction.reply({ content: i18n.__('moderation.status.start'), ephemeral: true });
        client.user.setActivity({ name, type, url });
        interaction.editReply({ content: i18n.__('moderation.status.complete') });
        return;
    },
};
//# sourceMappingURL=status.js.map