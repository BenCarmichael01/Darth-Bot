"use strict";
const { MessageActionRow, MessageButton } = require('discord.js');
const i18n = require('i18n');
function roll(args) {
    var min = Math.ceil(args[0]) ? Math.ceil(args[0]) : 1;
    var max = Math.floor(args[1]) ? Math.floor(args[1]) : 10;
    const output = Math.floor(Math.random() * (max - min + 1) + min);
    return output;
}
module.exports = {
    name: 'roll',
    category: 'fun',
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
    callback({ client, interaction, args }) {
        const output = roll(args);
        const row = new MessageActionRow().addComponents(new MessageButton().setCustomId('reRoll').setLabel('Re-Roll').setStyle('PRIMARY'));
        interaction.reply({
            content: i18n.__mf('roll.reply', { roll: output.toString() }),
            components: [row],
        });
        client.on('interactionCreate', (i) => {
            if (!i.isButton())
                return;
            if (i.customId === 'reRoll') {
                let reRoll = roll(args);
                i.update({
                    content: i18n.__mf('roll.reply', { roll: reRoll.toString() }),
                    components: [row],
                });
            }
        });
    },
};
//# sourceMappingURL=roll.js.map