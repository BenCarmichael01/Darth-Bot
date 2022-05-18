"use strict";
const { MSGTIMEOUT } = require(`${__base}include/utils`);
module.exports = {
    async reply({ message, interaction, content, ephemeral }) {
        if (message) {
            return message
                .reply(content)
                .then((msg) => {
                setTimeout(() => {
                    msg.delete().catch();
                }, MSGTIMEOUT);
            })
                .catch(console.error);
        }
        else if (interaction) {
            if (ephemeral) {
                return interaction.editReply({ content, ephemeral: true });
            }
            else {
                return interaction
                    .editReply({ content })
                    .then((msg) => {
                    setTimeout(() => {
                        msg.delete().catch(console.error);
                    }, MSGTIMEOUT);
                })
                    .catch(console.error);
            }
        }
    },
    async followUp({ message, interaction, content, ephemeral }) {
        if (message) {
            return message.channel
                .send(content)
                .then((msg) => {
                setTimeout(() => {
                    msg.delete().catch();
                }, MSGTIMEOUT);
            })
                .catch(console.error);
        }
        else if (interaction) {
            if (ephemeral) {
                return interaction.followUp({ content, ephemeral });
            }
            else {
                return interaction
                    .followUp({ content })
                    .then((msg) => {
                    setTimeout(() => {
                        msg.delete().catch();
                    }, MSGTIMEOUT);
                })
                    .catch(console.error);
            }
        }
    },
};
//# sourceMappingURL=responses.js.map