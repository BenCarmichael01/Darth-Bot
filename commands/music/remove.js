/* global __base */
const { canModifyQueue, LOCALE, MSGTIMEOUT } = require(`${__base}include/utils`);
const { npMessage } = require(`${__base}include/npmessage`);
const i18n = require('i18n');

i18n.setLocale(LOCALE);

const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;

module.exports = {
	name: 'remove',
	category: 'music',
	description: i18n.__('remove.description'),
	guildOnly: 'true',

	callback({ message, args, prefix }) {
		const queue = message.client.queue.get(message.guild.id);
		setTimeout(() => message.delete(), 2_500);
		if (!queue) {
			return message.channel
				.send(i18n.__('remove.errorNotQueue'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!canModifyQueue(message.member)) {
			return message.channel
				.send(i18n.__('common.errorNotChannel'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!args.length) {
			return message.channel
				.send(i18n.__mf('remove.usageReply', { prefix }))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		// const args = args//.join("");
		const songs = args.map((arg) => parseInt(arg, 10));
		const removed = [];

		if (pattern.test(args)) {
			queue.songs = queue.songs.filter((item, index) => {
				if (songs.find((songIndex) => songIndex === index)) {
					removed.push(item);
					return false;
				}
				return true;
			});
			npMessage({ message, prefix, npSong: queue.songs[0] });
			message.channel
				.send(
					`${message.author} ❌ removed \n**${removed
						.map((song) => song.title)
						.join('\n& ')}** \nfrom the queue.`,
				)
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		} else if (!Number.isNaN(args[0]) && args[0] >= 1 && args[0] <= queue.songs.length) {
			message.channel
				.send(
					`${message.author} ❌ removed **${
						queue.songs.splice(args[0] - 1, 1)[0].title
					}** from the queue.`,
				)
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);

			return npMessage({ message, prefix, npSong: queue.songs[0] });
		} else {
			message.channel
				.send(i18n.__mf('remove.usageReply', { prefix }))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
			return npMessage({ message, prefix, npSong: queue.songs[0] });
		}
	},
};
