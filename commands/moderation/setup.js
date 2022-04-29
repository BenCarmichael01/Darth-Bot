/* global __base */
const i18n = require('i18n');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const { LOCALE } = require(`${__base}include/utils`);
const { findById } = require(`${__base}include/findById`);
const { upsert } = require(`${__base}include/upsert`);
const voice = require('@discordjs/voice');

i18n.setLocale(LOCALE);

function isChannel(channelId, interaction) {
	let obj = interaction.guild.channels.cache.get(channelId);

	if (!obj || obj.type != 'GUILD_TEXT') return false;

	return true;
}
async function runSetup(interaction, channelTag, client, guild) {
	await interaction.reply({
		content: i18n.__mf('common.startSetup', { channel: channelTag }),
		ephemeral: true,
		components: [],
	});

	const connections = await voice.getVoiceConnections();
	connections?.forEach((connection) => {
		let channel = connection.joinConfig.channelId;
		let { guildId } = client.channels.resolve(channel);
		if (guildId === interaction.guildId) {
			connection.emit('setup');
		}
	});

	if (isChannel(channelTag, interaction)) {
		try {
			const musicChannel = interaction.guild.channels.cache.get(channelTag);

			// Delete existing messages in channel
			await musicChannel.bulkDelete(100, true);

			const outputQueue = i18n.__('npmessage.emptyQueue');
			const newEmbed = new MessageEmbed()
				.setColor('#5865F2')
				.setTitle(i18n.__('npmessage.title'))
				.setURL('')
				.setImage('https://i.imgur.com/TObp4E6.jpg')
				.setFooter(i18n.__('npmessage.footer'));
			const buttons = [
				new MessageButton().setCustomId('playpause').setEmoji('⏯').setStyle('SECONDARY'),
				new MessageButton().setCustomId('skip').setEmoji('⏭').setStyle('SECONDARY'),
				new MessageButton().setCustomId('loop').setEmoji('🔁').setStyle('SECONDARY'),
				new MessageButton().setCustomId('shuffle').setEmoji('🔀').setStyle('SECONDARY'),
				new MessageButton().setCustomId('stop').setEmoji('⏹').setStyle('SECONDARY'),
			];
			const row = new MessageActionRow().addComponents(...buttons);

			const playingMessage = await musicChannel.send({
				content: outputQueue,
				embeds: [newEmbed],
				components: [row],
			});
			const collector = playingMessage.createMessageComponentCollector({ componentType: 'BUTTON' });

			collector.on('collect', (i) => {
				if (!i.isButton()) return;
				const queue = client.queue.get(i.guildId); // .songs
				if (!queue) {
					i.reply({ content: i18n.__mf('nowplaying.errorNotQueue'), ephemeral: true });
				}
			});

			// updates/inserts musicChannel and playingMessage in db
			await upsert({
				_id: guild.id,
				musicChannel: musicChannel.id,
				playingMessage: playingMessage.id,
			});

			// Check if db was updated correctly
			const settings = await findById(guild.id);
			const MUSIC_CHANNEL_ID = settings?.musicChannel;
			if (MUSIC_CHANNEL_ID === channelTag) {
				interaction.followUp({
					content: i18n.__mf('moderation.setup.success', { MUSIC_CHANNEL_ID }),
					ephemeral: true,
				});
				// Push to cached db
				let { _doc } = settings;
				delete _doc._id;
				delete _doc.__v;
				await client.db.set(guild.id, _doc);
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
}

module.exports = {
	name: 'setup',
	category: 'moderation',
	description: 'Setup the channel you want to use for the music player',
	guildOnly: true,
	permissions: ['ADMINISTRATOR'],
	testOnly: true,
	slash: true,
	options: [
		{
			name: 'channel',
			description: 'The channel to be used for the music player',
			type: 'CHANNEL',
			channelTypes: ['GUILD_TEXT'],
			required: true,
		},
	],

	async callback({ interaction, args, guild, client }) {
		let channelTag = args[0];

		const buttons = [
			new MessageButton().setCustomId('yes').setStyle('SUCCESS').setLabel('Continue'),
			new MessageButton().setCustomId('no').setStyle('DANGER').setLabel('Cancel'),
		];
		const row = new MessageActionRow().addComponents(...buttons);
		const warning = await interaction.reply({
			content:
				'**WARNING**: this will first purge *all* messages in the channel you have selected!\nDo you wish to proceed to music channel setup?',
			ephemeral: true,
			components: [row],
			fetchReply: true,
		});
		warning
			.awaitMessageComponent({ componentType: 'BUTTON', time: 20_000 })
			.then((i) => {
				if (i.customId === 'yes') {
					runSetup(i, channelTag, client, guild);
				} else {
					i.reply({ content: 'Setup Cancelled', ephemeral: true });
				}
			})
			.catch(console.error);
	},
};
