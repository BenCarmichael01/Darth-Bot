"use strict";
const { MSGTIMEOUT } = require(`../../include/utils`);
module.exports = {
    name: 'help',
    category: 'help',
    description: 'Displays help menu',
    slash: 'both',
    testOnly: true,
    ownerOnly: true,
    callback({ message, interaction }) {
        if (interaction) {
            interaction.reply({
                content: 'The help menu is under maintainance.\nType a `/` to see a list of my commands',
                ephemeral: true,
            });
        }
        else {
            message
                .reply('The help menu is under maintainance.\nType a `/` to see a list of my commands')
                .then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, MSGTIMEOUT);
            });
        }
    },
};
//# sourceMappingURL=help.js.map