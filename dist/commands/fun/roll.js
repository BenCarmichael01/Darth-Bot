var _a = require('discord.js'), MessageActionRow = _a.MessageActionRow, MessageButton = _a.MessageButton;
var i18n = require('i18n');
function roll(args) {
    var min = Math.ceil(args[0]) ? Math.ceil(args[0]) : 1;
    var max = Math.floor(args[1]) ? Math.floor(args[1]) : 10;
    var output = Math.floor(Math.random() * (max - min + 1) + min); // returns a random integer from lowerLimit to upperLimit
    return output;
}
module.exports = {
    name: 'roll',
    category: 'fun',
    // argsType: 'multiple',
    description: 'Gives a random number between the specified values',
    slash: true,
    options: [
        {
            name: 'lowest-value',
            description: 'The lower bound of the roll',
            required: true,
            type: 'INTEGER',
        },
        {
            name: 'highest-value',
            description: 'The upper bound of the roll',
            required: true,
            type: 'INTEGER',
        },
    ],
    callback: function (_a) {
        var client = _a.client, interaction = _a.interaction, args = _a.args;
        var output = roll(args);
        var row = new MessageActionRow().addComponents(new MessageButton().setCustomId('reRoll').setLabel('Re-Roll').setStyle('PRIMARY'));
        interaction.reply({
            content: i18n.__mf('roll.reply', { roll: output.toString() }),
            components: [row],
        });
        client.on('interactionCreate', function (i) {
            if (!i.isButton())
                return;
            if (i.customId === 'reRoll') {
                var reRoll = roll(args);
                i.update({
                    content: i18n.__mf('roll.reply', { roll: reRoll.toString() }),
                    components: [row],
                });
            }
        });
    },
};
