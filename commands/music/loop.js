const { canModifyQueue, LOCALE } = require("@util/utils");
const i18n = require("i18n");
const { Command } = require('@sapphire/framework');
i18n.setLocale(LOCALE);

module.exports = class loopCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'loop',
			group: 'music',
			memberName: 'loop',
			description: i18n.__('loop.description'),
			guildOnly: 'true',
		});
	}
	async run(message, args) {
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) return message.reply(i18n.__("loop.errorNotQueue")).catch(console.error);
		if (!canModifyQueue(message.member)) return i18n.__("common.errorNotChannel");

		// toggle from false to true and reverse
		queue.loop = !queue.loop;
		return queue.textChannel
			.send(i18n.__mf("loop.result", { loop: queue.loop ? i18n.__("common.on") : i18n.__("common.off") }))
			.catch(console.error);
	}
};
