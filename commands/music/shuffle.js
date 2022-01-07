const { canModifyQueue, LOCALE } = require(`${__base}include/utils`);
const i18n = require('i18n');

i18n.setLocale(LOCALE);

module.exports = {
	name: 'shuffle',
	category: 'music',
	description: i18n.__('shuffle.description'),
	guildOnly: 'true',

	callback({ message }) {
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) {
			return message.channel
				.send(i18n.__('shuffle.errorNotQueue'))
				.catch(console.error);
		}
		if (!canModifyQueue(message.member)) {
			return i18n.__('common.errorNotChannel');
		}
		const { songs } = queue;
		console.log(songs);
		for (let i = songs.length - 1; i > 1; i--) {
			let j = 1 + Math.floor(Math.random() * i);
			[songs[i], songs[j]] = [songs[j], songs[i]];
		}
		queue.songs = songs;
		message.client.queue.set(message.guild.id, queue);
		console.log(message.client.queue.get(message.guildId).songs);
		queue.textChannel
			.send(i18n.__mf('shuffle.result', { author: message.author.id }))
			.catch(console.error);
	},
};
