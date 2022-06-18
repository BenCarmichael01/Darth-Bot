import {
	Client,
	CommandInteraction,
	Guild,
	MessageEmbed,
	MessageActionRow,
	MessageButton,
	ButtonInteraction,
} from 'discord.js';
import i18n from 'i18n';
import * as voice from '@discordjs/voice';

import { LOCALE } from '../../include/utils';
import findById from '../../include/findById';
import { upsert } from '../../include/upsert';
import { CustomConnection, IQueue } from 'src/types';

// // i18n.setLocale(LOCALE);

async function runSetup(interaction: ButtonInteraction, channelTag: string, client: Client, guild: Guild) {
	await interaction.reply({
		content: i18n.__mf('moderation.setup.start', { channel: channelTag }),
		ephemeral: true,
		components: [],
	});

	const connection = voice.getVoiceConnection(interaction.guildId!) as CustomConnection &
		voice.VoiceConnection;
	const queue = interaction.client.queue.get(interaction.guildId!) as IQueue;

	// Stop current queue if it exists
	if (queue && queue.player) {
		try {
			queue.player.stop();
		} catch (error) {
			console.error(error);
		}
		connection.destroy();
		interaction.client.queue.delete(interaction.guildId!);
	}

	try {
		const musicChannel = interaction.guild?.channels.cache.get(channelTag);

		if (!musicChannel || musicChannel.type != 'GUILD_TEXT') {
			interaction.followUp({
				content: i18n.__('moderation.setup.notChannel'),
				ephemeral: true,
			});
			return;
		}

		// Delete existing messages in channel
		await musicChannel?.bulkDelete(100, true);

		const outputQueue = i18n.__('npmessage.emptyQueue');
		const newEmbed = new MessageEmbed()
			.setColor('#5865F2')
			.setTitle(i18n.__('npmessage.title'))
			.setURL('')
			.setImage('https://i.imgur.com/TObp4E6.jpg')
			.setFooter({ text: i18n.__('npmessage.footer') });
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
			const queue = client.queue.get(i.guildId!); // .songs
			if (!queue) {
				i.reply({ content: i18n.__mf('nowplaying.errorNotQueue'), ephemeral: true });
			}
		});

		// updates/inserts musicChannel and playingMessage in db
		const doc = await upsert({
			_id: guild.id,
			musicChannel: musicChannel.id,
			playingMessage: playingMessage.id,
		});

		// Check if db was updated correctly
		const MUSIC_CHANNEL_ID = doc?.musicChannel;
		const PLAYING_MESSAGE_ID = doc?.playingMessage;

		if (MUSIC_CHANNEL_ID === channelTag && PLAYING_MESSAGE_ID === playingMessage.id) {
			// Push to cached db
			client.db.set(guild.id, {
				musicChannel: MUSIC_CHANNEL_ID,
				playingMessage: PLAYING_MESSAGE_ID,
			});
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
	} catch (e) {
		var e;
		if (typeof e === 'string') {
			var error = e; // works, `e` narrowed to string
		} else if (e instanceof Error) {
			var error = e.message; // works, `e` narrowed to Error
		} else return;
		console.error(error);
		interaction.followUp({
			content: i18n.__('moderation.setup.error', { error }),
			ephemeral: true,
		});
	}
}

module.exports = {
	name: 'setup',
	category: 'moderation',
	description: i18n.__('moderation.setup.description'),
	guildOnly: true,
	slash: true,
	ownerOnly: true,
	options: [
		{
			name: 'channel',
			description: i18n.__('moderation.setup.optionDescription'),
			type: 'CHANNEL',
			channelTypes: ['GUILD_TEXT'],
			required: true,
		},
	],

	async callback({
		interaction,
		args,
		guild,
		client,
	}: {
		interaction: CommandInteraction;
		args: string[];
		guild: Guild;
		client: Client;
	}) {
		let channelTag = args[0];

		const buttons = [
			new MessageButton()
				.setCustomId('yes')
				.setStyle('SUCCESS')
				.setLabel(i18n.__('moderation.setup.continue')),
			new MessageButton()
				.setCustomId('no')
				.setStyle('DANGER')
				.setLabel(i18n.__('moderation.setup.cancel')),
		];
		const row = new MessageActionRow().addComponents(...buttons);
		const warning = await interaction.reply({
			content: i18n.__('moderation.setup.warning'),
			ephemeral: true,
			components: [row],
			fetchReply: true,
		});
		if ('awaitMessageComponent' in warning) {
			warning
				.awaitMessageComponent({ componentType: 'BUTTON', time: 20_000 })
				.then((i) => {
					if (i.customId === 'yes') {
						runSetup(i, channelTag, client, guild);
					} else {
						i.reply({ content: i18n.__('moderation.setup.cancelled'), ephemeral: true });
					}
				})
				.catch(console.error);
		}
	},
};
