/* global __base */
const i18n = require('i18n');

const { MSGTIMEOUT } = require(`${__base}include/utils`);

module.exports = {
	name: 'status',
	description: 'Update bot status',
	category: 'moderation',
	ownerOnly: true,
	// TODO status needs to be saved to mongoDB and re-set on startup to remain persistent
	// TODO usage reply should also include <prefix>status at beginning
	async callback({ message, args, client }) {
		const statusTypes = ['PLAYING', 'WATCHING', 'STREAMING', 'LISTENING', 'COMPETING'];
		const statusType = args.shift().toUpperCase();
		const statusText = args.join(' ');
		if (!statusText) {
			return message.reply(i18n.__('moderation.status.noText') + i18n.__('moderation.status.usage')).then((msg) => {
				setTimeout(() => { msg.delete(); message.delete(); }, MSGTIMEOUT);
			});
		}
		if (statusTypes.includes(statusType)) {
			client.user.setActivity(statusText, { type: statusType });
			message.channel.send(i18n.__('moderation.status.complete'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				});
			message.delete();
		} else {
			message.reply(i18n.__('moderation.status.noType') + i18n.__('moderation.status.usage'))
				.then((msg) => {
					setTimeout(() => { msg.delete(); message.delete(); }, 10000);
				})
				.catch(console.error);
			// message.reply(i18n.__('moderation.status.usage')).then((msg) => {
			// 	setTimeout(() => { msg.delete(); message.delete(); }, MSGTIMEOUT + 1500);
			// })
			// 	.catch(console.error);
		}
	},
};
