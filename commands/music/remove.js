require('module-alias/register');
const { canModifyQueue, LOCALE, MSGTIMEOUT } = require('@util/utils');
const i18n = require('i18n');
const Commando = require('discord.js-commando');
const path = require('path');

i18n.setLocale(LOCALE);

const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;

module.exports = class removeCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'remove',
			aliases: ['rm', 'del'],
			group: 'music',
			memberName: 'remove',
			description: i18n.__('remove.description'),
			guildOnly: 'true',
			argsType: 'single',
		});
	}

	async run(message, args) {
		message.delete({ TIMEOUT: MSGTIMEOUT });
		const queue = message.client.queue.get(message.guild.id);

		if (!queue) {
			return message.channel.send(i18n.__('remove.errorNotQueue'))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}
		if (!canModifyQueue(message.member)) {
			return i18n.__('common.errorNotChannel')
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}
		if (!args.length) {
			return message.reply(i18n.__mf('remove.usageReply', { prefix: message.client.prefix }))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}

		// const args = args//.join("");
		const songs = args.split(', ').map((arg) => parseInt(arg));
		let removed = [];

		if (pattern.test(args)) {
			queue.songs = queue.songs.filter((item, index) => {
				if (songs.find((songIndex) => songIndex - 1 === index)) removed.push(item);
				else return true;
			});

			queue.textChannel.send(
				`${message.author} ❌ removed **${removed.map((song) => song.title).join('\n')}** from the queue.`
			).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
		} else if (!Number.isNaN(args[0]) && args[0] >= 1 && args[0] <= queue.songs.length) {
			console.log('we got elsed!');
			return queue.textChannel.send(
				`${message.author} ❌ removed **${queue.songs.splice(args[0] - 1, 1)[0].title}** from the queue.`
			).then((msg) => {
				msg.delete({ timeout: MSGTIMEOUT });
			}).catch(console.error);
		} else {
			console.log('we got the last one');
			return message.reply(i18n.__mf('remove.usageReply', { prefix: message.client.prefix }))
				.then((msg) => {
					msg.delete({ timeout: MSGTIMEOUT });
				}).catch(console.error);
		}
	}
};
