"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.followUp = exports.reply = void 0;
const { MSGTIMEOUT } = require(`${__base}include/utils`);
async function reply({ message, interaction, content, ephemeral, }) {
    if (message) {
        return message
            .reply(content)
            .then((msg) => {
            setTimeout(() => {
                msg.delete().catch();
            }, MSGTIMEOUT);
            return msg;
        })
            .catch((error) => {
            console.error(error);
            return undefined;
        });
    }
    else if (interaction) {
        if (ephemeral) {
            return Promise.resolve(interaction.editReply({ content }));
        }
        else {
            if ('command' in interaction) {
                return interaction
                    .editReply({ content })
                    .then((msg) => {
                    setTimeout(() => {
                        if ('delete' in msg) {
                            msg.delete().catch(console.error);
                        }
                    }, MSGTIMEOUT);
                    return msg;
                })
                    .catch((error) => {
                    console.error(error);
                    return undefined;
                });
            }
        }
    }
    Promise.reject();
}
exports.reply = reply;
function followUp({ message, interaction, content, ephemeral, }) {
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
        if (ephemeral === true) {
            return Promise.resolve(interaction.followUp({ content, ephemeral }));
        }
        else {
            return interaction
                .followUp({ content })
                .then((msg) => {
                setTimeout(() => {
                    if ('delete' in msg) {
                        msg.delete().catch();
                    }
                }, MSGTIMEOUT);
            })
                .catch(console.error);
        }
    }
    return Promise.reject();
}
exports.followUp = followUp;
//# sourceMappingURL=responses.js.map