/* global __base */
const i18n = require('i18n');
const { MessageEmbed } = require('discord.js');

const { MSGTIMEOUT, LOCALE } = require(`${__base}include/utils`);
const { findById } = require(`${__base}include/findById`);
const { upsert } = require(`${__base}include/upsert`);

i18n.setLocale(LOCALE);
module.exports = {
	name: 'setup',
	category: 'moderation',
	description: 'Setup the channel for music commands',
	guildOnly: 'true',
	permissions: ['ADMINISTRATOR'],
	// argsType: 'multiple',

	async callback({
		message,
		args,
		prefix,
		guild,
	}) {
		let channelTag = args[0];
		channelTag = JSON.stringify(channelTag).replace(/[""#<>]/g, '');

		message.channel.send(i18n.__mf('common.startSetup', { channel: channelTag }))
			.then((msg) => {
				setTimeout(() => msg.delete(), (MSGTIMEOUT + 2000));
			}).catch(console.error);

		if (message.guild.channels.cache.get(channelTag)) {
			try {
				const musicChannel = message.guild.channels.cache.get(channelTag);

				const outputQueue = '__**Up Next:**__:\nSend a url or a song name to start the queue';
				const newEmbed = new MessageEmbed()
					.setColor('#5865F2')
					.setTitle('🎶 Nothing is playing right now')
					.setImage('https://i.imgur.com/TObp4E6.jpg')
					.setFooter(`The prefix for this server is ${prefix}`);

				const playingMessage = await musicChannel.send({ content: outputQueue, embeds: [newEmbed] });
				await playingMessage.react('⏯');
				await playingMessage.react('⏭');
				await playingMessage.react('🔇');
				await playingMessage.react('🔉');
				await playingMessage.react('🔊');
				await playingMessage.react('🔁');
				await playingMessage.react('⏹');

				// Creates temp collector to remove reactions before bot restarts and uses the one in 'on ready' event
				const filter = (reaction, user) => user.id !== message.client.user.id;
				const collector = playingMessage.createReactionCollector({ filter });
				collector.on('collect', (reaction, user) => {
					const queue = reaction.message.client.queue.get(reaction.message.guild.id);// .songs
					if (!queue) {
						reaction.users.remove(user).catch(console.error);
						reaction.message.channel.send(i18n.__mf('nowplaying.errorNotQueue'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							}).catch(console.error);
					}
				});

				// updates/inserts musicChannel and playingMessage in db
				await upsert({
					_id: guild.id,
					musicChannel: musicChannel.id,
					playingMessage: playingMessage.id,
				});

				// Check if db was updated correctly
				const MUSIC_CHANNEL_ID = (await findById(guild.id)).musicChannel;
				console.log(MUSIC_CHANNEL_ID);
				if (MUSIC_CHANNEL_ID === channelTag) {
					message.channel.send(`The music channel has been set to <#${MUSIC_CHANNEL_ID}> \n Setup Complete!`)
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						}).catch(console.error);
					message.delete();
				} else {
					message.channel.send('Sorry, it doesn\'t seem like that worked. Please try again')
						.then((msg) => {
							setTimeout(() => msg.delete(), MSGTIMEOUT);
						}).catch(console.error);
					message.delete();
				}
			} catch (error) {
				console.error(error);
				message.channel.send('Sorry there has been an error.')
					.then((msg) => {
						setTimeout(() => msg.delete(), MSGTIMEOUT);
					}).catch(console.error);
				message.delete();
			}
		} else {
			message.channel.send('Sorry, that is not a valid channel. Please tag the channel: #<music_channel>')
				.then((msg) => {
					setTimeout(() => msg.delete(), MSGTIMEOUT);
				}).catch(console.error);
			message.delete();
		}
	},
};
