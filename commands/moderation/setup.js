/* global __base */
const i18n = require('i18n');
const { MessageEmbed } = require('discord.js');

const { MSGTIMEOUT, LOCALE } = require(`${__base}include/utils`);
const { findById } = require(`${__base}include/findById`);
const { upsert } = require(`${__base}include/upsert`);
const voice = require('@discordjs/voice');

i18n.setLocale(LOCALE);

function isChannel(channelId, interaction) {
	let obj = interaction.guild.channels.cache.get(channelId);

	if (!obj || obj.type != 'GUILD_TEXT') return false;

	return true;
}

module.exports = {
	name: 'setup',
	category: 'moderation',
	description: 'Setup the channel you want to use for the music player',
	guildOnly: 'true',
	permissions: ['ADMINISTRATOR'],
	testOnly: true,
	slash: true,
	options: [
		{
			name: 'channel',
			description: 'The channel to be used for the music player',
			type: 'CHANNEL',
			required: true,
		},
	],

	async callback({ interaction, args, prefix, guild, client }) {
		let channelTag = args[0];

		await interaction.reply({
			content: i18n.__mf('common.startSetup', { channel: channelTag }),
			ephemeral: true,
		});

		const connections = await voice.getVoiceConnections();
		connections?.forEach((connection) => {
			connection.emit('setup');
		});

		if (isChannel(channelTag, interaction)) {
			try {
				const musicChannel = interaction.guild.channels.cache.get(channelTag);

				const outputQueue = i18n.__('npmessage.emptyQueue');
				const newEmbed = new MessageEmbed()
					.setColor('#5865F2')
					.setTitle(i18n.__('npmessage.title'))
					.setURL('')
					.setImage('https://i.imgur.com/TObp4E6.jpg')
					.setFooter(i18n.__mf('npmessage.prefix', { prefix }));

				const playingMessage = await musicChannel.send({ content: outputQueue, embeds: [newEmbed] });
				await playingMessage.react('⏯');
				await playingMessage.react('⏭');
				/* await playingMessage.react('🔇');
				await playingMessage.react('🔉');
				await playingMessage.react('🔊'); */
				await playingMessage.react('🔁');
				await playingMessage.react('🔀');
				await playingMessage.react('⏹');

				// Creates temp collector to remove reactions before bot restarts and uses the one in 'on ready' event
				const filter = (reaction, user) => user.id !== client.user.id;
				const collector = playingMessage.createReactionCollector({ filter });
				collector.on('collect', (reaction, user) => {
					const queue = client.queue.get(reaction.message.guild.id); // .songs
					if (!queue) {
						reaction.users.remove(user).catch(console.error);
						reaction.message.channel
							.send(i18n.__mf('nowplaying.errorNotQueue'))
							.then((msg) => {
								setTimeout(() => msg.delete(), MSGTIMEOUT);
							})
							.catch(console.error);
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
				if (MUSIC_CHANNEL_ID === channelTag) {
					interaction.followUp({
						content: i18n.__mf('moderation.setup.success', { MUSIC_CHANNEL_ID }),
						ephemeral: true,
					});
				} else {
					interaction.followUp({
						content: i18n.__mf('moderation.setup.fail'),
						ephemeral: true,
					});
				}
			} catch (error) {
				console.error(error);
				interaction.followUp({
					content: i18n.__('moderation.setup.error', { error: error.message }),
					ephemeral: true,
				});
			}
		} else {
			interaction.followUp({
				content: i18n.__('moderation.setup.notChannel'),
				ephemeral: true,
			});
		}
	},
};
