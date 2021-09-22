const { canModifyQueue, LOCALE } = require("../../util/utils");
const i18n = require("i18n");
const Commando = require('discord.js-commando')
const path = require('path');

i18n.setLocale(LOCALE);

module.exports = class volumeCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'volume',
            group: 'music',
            memberName: 'volume',
            description: i18n.__("volume.description"),
            guildOnly: 'true',
            argsType: 'multiple'
        })
    };

    async run(message, args) {
        const queue = message.client.queue.get(message.guild.id);

        if (!queue) return message.reply(i18n.__("volume.errorNotQueue")).catch(console.error);
        if (!canModifyQueue(message.member))
            return message.reply(i18n.__("volume.errorNotChannel")).catch(console.error);

        if (!args[0]) return message.reply(i18n.__mf("volume.currentVolume", { volume: queue.volume })).catch(console.error);
        if (isNaN(args[0])) return message.reply(i18n.__("volume.errorNotNumber")).catch(console.error);
        if (Number(args[0]) > 100 || Number(args[0]) < 0)
            return message.reply(i18n.__("volume.errorNotValid")).catch(console.error);

        queue.volume = args[0];
        queue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);
        return queue.textChannel.send(i18n.__mf("volume.result", { arg: args[0] })).catch(console.error);
    };
};
