"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
const utils_1 = require("../../include/utils");
function roll(args) {
    var min = Math.ceil(args[0]) ? Math.ceil(args[0]) : 1;
    var max = Math.floor(args[1]) ? Math.floor(args[1]) : 10;
    const output = Math.floor(Math.random() * (max - min + 1) + min);
    return output;
}
exports.default = {
    name: 'roll',
    category: 'fun',
    description: 'Gives a random number between the specified values',
    slash: true,
    testOnly: utils_1.TESTING,
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
        const parsedArgs = args.map((arg) => parseInt(arg));
        const output = roll(parsedArgs);
        const row = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setCustomId('reRoll').setLabel('Re-Roll').setStyle('PRIMARY'));
        interaction.reply({
            content: i18n_1.default.__mf('roll.reply', { roll: output.toString() }),
            components: [row],
        });
        client.on('interactionCreate', (i) => {
            if (!i.isButton())
                return;
            if (i.customId === 'reRoll') {
                let reRoll = roll(parsedArgs);
                i.update({
                    content: i18n_1.default.__mf('roll.reply', { roll: reRoll.toString() }),
                    components: [row],
                });
            }
        });
    },
};
//# sourceMappingURL=roll.js.map