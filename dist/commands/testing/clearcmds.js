"use strict";
module.exports = {
    name: 'clearcmds',
    description: 'Deletes all guild commands in this guild',
    category: 'testing',
    testOnly: true,
    slash: true,
    permissions: ['ADMINISTRATOR'],
    async callback({ interaction, guild, instance, client }) {
        interaction.reply({ content: 'Deleting...', ephemeral: true });
        guild.commands.cache.forEach((value, key) => {
            guild.commands.cache.delete(value);
        });
    },
};
//# sourceMappingURL=clearcmds.js.map