const { canModifyQueue, LOCALE } = require("../../util/utils");
const i18n = require("i18n");
const Commando = require('discord.js-commando')
const path = require('path');

i18n.setLocale(LOCALE);

module.exports = class skipCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'skip',
			group: 'music',
			memberName: 'skip',
			description: i18n.__("skip.description"),
			guildOnly: 'true',
		})
	};
	async run(message, args) {
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return message.reply(i18n.__("skip.errorNotQueue")).catch(console.error);
		if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");

		queue.playing = true;
		queue.connection.dispatcher.end();
		queue.textChannel.send(i18n.__mf("skip.result", { author: message.author })).catch(console.error);
	}
};
