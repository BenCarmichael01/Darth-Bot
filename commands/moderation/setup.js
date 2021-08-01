const { mutate } = require('array-move');
const { Channel } = require('discord.js');
const Discord = require('discord.js');

const fs = require('fs');
const i18n = require('i18n');
const sqlite3 = require('sqlite3').verbose();
const sql = require('sqlite');
const { openDb } = require('@include/opendb');
const path = require('path');
const Commando = require('discord.js-commando');
const { npMessage } = require('@include/npmessage');
// const { playingMessageId, MUSIC_CHANNEL_ID } = require('../util/utils');
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
		// console.log(channelTag);
		// console.log(message.guild.channels.cache.get(channelTag));

		const prefix = message.guild.commandPrefix;

		if (message.guild.channels.cache.get(channelTag)) {
			try {
				const db = await openDb();
				// Create nowplaying message to be pushed to channel
				const musicChannel = message.guild.channels.cache.get(channelTag);

				/* const image = fs.readFileSync(path.resolve('./media/grogu.jpg'));
				const attachment = new Discord.MessageAttachment(image, 'grogu.jpg'); */

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
				// Updates db entry for server if exists, if not then it creates one
				const { settings } = message.guild;
				console.log(await settings.set('musicChannel', channelTag));
				console.log(await settings.set('playingMessage', playingMessage.id));
				/* await db.run(`UPDATE servers SET channelId=${channelTag}, playingMessageId=${playingMessage.id} WHERE guildId=${message.guild.id};`)
					.then(async (rows) => {
						if (rows.changes === 0) {
							await db.run(`INSERT INTO servers(guildId, channelId, playingMessageId) VALUES (${message.guild.id}, ${channelTag}, ${playingMessage.id})`);
						}
					});
				const MUSIC_CHANNEL_ID = (await db.get(`SELECT channelId FROM servers WHERE guildId='${message.guild.id}'`)).channelId;
				*/
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
