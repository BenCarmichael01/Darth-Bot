const Discord = require('discord.js');
const i18n = require('i18n');
const Commando = require('discord.js-commando');
const { MSGTIMEOUT } = require('../../util/utils');

module.exports = class setupCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'setup',
			group: 'moderation',
			memberName: 'setup',
			description: 'Setup the channel for music commands',
			guildOnly: 'true',
			argsType: 'multiple',
		});
	}

	async run(message, args) {
		let channelTag = args[0];
		channelTag = JSON.stringify(channelTag).replace(/[""#<>]/g, '');

		message.channel.send(i18n.__mf('common.startSetup', { channel: channelTag }))
			.then((msg) => { msg.delete({ timeout: MSGTIMEOUT }); })
			.catch(console.error);

		const prefix = message.guild.commandPrefix;

		if (message.guild.channels.cache.get(channelTag)) {
			try {
				const musicChannel = message.guild.channels.cache.get(channelTag);

				const outputQueue = '__**Up Next:**__:\nSend a url or a song name to start the queue';
				const newEmbed = new Discord.MessageEmbed()
					.setColor('#5865F2')
					.setTitle('🎶 Nothing is playing right now')
					.setURL('')
					.setImage('https://i.imgur.com/TObp4E6.jpg')
					.setFooter(`The prefix for this server is ${prefix}`);

				const playingMessage = await musicChannel.send(outputQueue, newEmbed);
				await playingMessage.react('⏭');
				await playingMessage.react('⏯');
				await playingMessage.react('🔇');
				await playingMessage.react('🔉');
				await playingMessage.react('🔊');
				await playingMessage.react('🔁');
				await playingMessage.react('⏹');

				// Creates temp collector to remove reactions before bot restarts and uses the one in 'on ready' event
				const filter = (reaction, user) => user.id !== message.client.user.id;
				const collector = playingMessage.createReactionCollector(filter);
				collector.on('collect', (reaction, user) => {
					const queue = reaction.message.client.queue.get(reaction.message.guild.id);// .songs
					if (!queue) {
						reaction.users.remove(user).catch(console.error);
						reaction.message.channel.send(i18n.__mf('nowplaying.errorNotQueue'))
							.then((msg) => {
								msg.delete({ timeout: MSGTIMEOUT });
							}).catch(console.error);
					}
				});
				// Sets musicChannel and playingMessageId in settings db
				const { settings } = message.guild;
				console.log(await settings.set('musicChannel', channelTag));
				console.log(await settings.set('playingMessage', playingMessage.id));

				// Check if db was updated correctly
				const MUSIC_CHANNEL_ID = settings.get('musicChannel');
				if (MUSIC_CHANNEL_ID === channelTag) {
					message.channel.send(`The music channel has been set to <#${MUSIC_CHANNEL_ID}> \n Setup Complete!`)
						.then((msg) => {
							msg.delete({ timeout: MSGTIMEOUT });
						}).catch(console.error);
					message.delete();
				}
			} catch (error) {
				console.error(error);
				message.channel.send('Sorry there has been an error.');
			}
		} else {
			message.channel.send('Sorry, that is not a valid channel. Please tag the channel: #<music_channel>');
		}
	}
};
