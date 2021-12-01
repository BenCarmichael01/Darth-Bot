/* global __base */
const { canModifyQueue, LOCALE, MSGTIMEOUT } = require(`${__base}include/utils`);
const i18n = require('i18n');

i18n.setLocale(LOCALE);

module.exports = {
	name: 'loop',
	category: 'music',
	description: i18n.__('loop.description'),
	guildOnly: 'true',

	callback({ message }) {
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) {
			return message.reply(i18n.__('loop.errorNotQueue')).then((msg) => {
				setTimeout(() => msg.delete(), MSGTIMEOUT);
			}).catch(console.error);
		}
		if (!canModifyQueue(message.member)) {
			return message.reply(i18n.__('common.errorNotChannel')).then((msg) => {
				setTimeout(() => msg.delete(), MSGTIMEOUT);
			}).catch(console.error);
		}
		// toggle from false to true and reverse
		queue.loop = !queue.loop;
		return queue.textChannel
			.send(i18n.__mf('loop.result', { loop: queue.loop ? i18n.__('common.on') : i18n.__('common.off') }))
			.then((msg) => {
				setTimeout(() => msg.delete(), (MSGTIMEOUT));
			}).catch(console.error);
	},
};
