/* global __base */
const createBar = require('string-progressbar');
const { MessageEmbed } = require('discord.js');
const i18n = require('i18n');

const { LOCALE, MSGTIMEOUT } = require(`${__base}include/utils`);

i18n.setLocale(LOCALE);
// TODO call npmessage from here or maybe delete this command altogether
module.exports = {
	name: 'nowplaying',
	category: 'music',
	description: i18n.__('nowplaying.description'),
	guildOnly: 'true',

	callback({ message }) {
		const queue = message.client.queue.get(message.guild.id);
		if (!queue) {
			return message.reply(i18n.__('nowplaying.errorNotQueue')).then((msg) => {
				setTimeout(() => msg.delete(), MSGTIMEOUT);
			}).catch(console.error);
		}

		const song = queue.songs[0];
		const seek = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000;
		const left = song.duration - seek;

		const nowPlaying = new MessageEmbed()
			.setTitle(i18n.__('nowplaying.embedTitle'))
			.setDescription(`${song.title}\n${song.url}`)
			.setColor('#F8AA2A')
			.setAuthor(message.client.user.username);

		if (song.duration > 0) {
			nowPlaying.addField(
				'\u200b',
				new Date(seek * 1000).toISOString().substr(11, 8)
				+ '['
				+ createBar(song.duration === 0 ? seek : song.duration, seek, 20)[0]
				+ ']'
				+ (song.duration === 0 ? ' ◉ LIVE' : new Date(song.duration * 1000).toISOString().substr(11, 8)),
				false,
			);
			nowPlaying.setFooter(
				i18n.__mf('nowplaying.timeRemaining', { time: new Date(left * 1000).toISOString().substr(11, 8) }),
			);
		}

		return message.channel.send(nowPlaying).then((msg) => {
			setTimeout(() => msg.delete(), MSGTIMEOUT);
		}).catch(console.error);
	},
};
