/* global __base */
const move = require('array-move');
const i18n = require('i18n');

const {
	canModifyQueue,
	LOCALE,
	MSGTIMEOUT,
} = require(`${__base}/include/utils`);
const { npMessage } = require(`${__base}include/npmessage`);

i18n.setLocale(LOCALE);

module.exports = {
	name: 'move',
	aliases: ['mv'],
	category: 'music',
	description: i18n.__('move.description'),
	guildOnly: 'true',
	usage: i18n.__('move.usagesReply'),

	callback({ message, args, prefix }) {
		const queue = message.client.queue.get(message.guild.id);
		setTimeout(() => {
			message.delete();
		}, 3_000);
		if (!queue) {
			return message
				.reply(i18n.__('move.errorNotQueue'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (!canModifyQueue(message.member)) return;

		if (!args.length) {
			return message
				.reply(i18n.__mf('move.usagesReply', { prefix }))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		if (Number.isNaN(args[0]) || args[0] < 1) {
			return message
				.reply(i18n.__mf('move.usagesReply', { prefix }))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}

		const currentPos = args[0];
		const newPos = args[1];
		const song = queue.songs[newPos];
		if (
			currentPos > queue.songs.length - 1 ||
			newPos > queue.songs.length - 1
		) {
			return message
				.reply(i18n.__('move.range'))
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				})
				.catch(console.error);
		}
		queue.songs = move(queue.songs, currentPos, newPos);
		npMessage({ message, npSong: queue.songs[0], prefix });
		message.channel
			.send(
				i18n.__mf('move.result', {
					author: message.author.id,
					title: song.title,
					index: newPos,
				}),
			)
			.then((msg) => {
				setTimeout(() => {
					msg.delete();
				}, MSGTIMEOUT);
			})
			.catch(console.error);
		message.delete();
	},
};
