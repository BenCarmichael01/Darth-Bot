var MSGTIMEOUT = require("../../include/utils").MSGTIMEOUT;
module.exports = {
    name: 'help',
    category: 'help',
    description: 'Displays help menu',
    slash: 'both',
    testOnly: true,
    ownerOnly: true,
    callback: function (_a) {
        var message = _a.message, interaction = _a.interaction;
        if (interaction) {
            interaction.reply({
                content: 'The help menu is under maintainance.\nType a `/` to see a list of my commands',
                ephemeral: true,
            });
        }
        else {
            message
                .reply('The help menu is under maintainance.\nType a `/` to see a list of my commands')
                .then(function (msg) {
                setTimeout(function () {
                    msg.delete();
                }, MSGTIMEOUT);
            });
        }
    },
};
