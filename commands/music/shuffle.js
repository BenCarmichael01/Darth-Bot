/* global __base */
const { canModifyQueue, LOCALE, MSGTIMEOUT } = require(`${__base}include/utils`);
const { npMessage } = require(`${__base}include/npmessage`);
const i18n = require('i18n');

i18n.setLocale(LOCALE);

module.exports = {
	name: 'shuffle',
	category: 'music',
	description: i18n.__('shuffle.description'),
	guildOnly: 'true',
	slash: 'both',

	callback({ message, interaction, prefix }) {
		const command = message ? message : interaction;
		const queue = command.client.queue.get(command.guildId);
		if (!queue) {
			return command
				.reply({ content: i18n.__('shuffle.errorNotQueue'), ephemeral: true })
				.then((msg) => {
					setTimeout(() => {
						if (msg) {
							msg.delete();
							command.delete();
						}
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!canModifyQueue(command.member)) {
			return command
				.reply({
					content: i18n.__('common.errorNotChannel'),
					ephemeral: true,
				})
				.then((msg) => {
					setTimeout(() => {
						if (msg) {
							msg.delete();
							command.delete();
						}
					}, MSGTIMEOUT);
				})
				.catch(console.error);
		}
		const { songs } = queue;
		// console.log(songs);
		for (let i = songs.length - 1; i > 1; i--) {
			const j = 1 + Math.floor(Math.random() * i);
			[songs[i], songs[j]] = [songs[j], songs[i]];
		}
		queue.songs = songs;
		command.client.queue.set(command.guildId, queue);
		npMessage({ message: command, npSong: songs[0], prefix });
		return command
			.reply({
				content: i18n.__mf('shuffle.result', { author: command.member.id }),
				ephemeral: true,
			})
			.then((msg) => {
				setTimeout(() => {
					if (msg) {
						msg.delete();
						command.delete();
					}
				}, MSGTIMEOUT);
			})
			.catch(console.error);
		// console.log(command.client.queue.get(command.guildId).songs);
		// queue.textChannel
		// 	.send(i18n.__mf('shuffle.result', { author: command.member.id }))
		// 	.catch(console.error);
	},
};
