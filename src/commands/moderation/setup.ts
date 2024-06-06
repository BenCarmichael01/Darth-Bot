import {
	Client,
	Guild,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ChannelType,
	ComponentType,
	EmbedBuilder,
	ButtonStyle,
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	TextChannel,
	PermissionFlagsBits,
} from 'discord.js';
import i18n from 'i18n';
import * as voice from '@discordjs/voice';

import { LOCALE } from '../../include/utils';
import { CustomConnection, IQueue } from '../../types/types';
if (LOCALE) i18n.setLocale(LOCALE);

async function runSetup(interaction: ButtonInteraction, musicChannel: TextChannel, client: Client, guild: Guild) {
	await interaction.reply({
		content: i18n.__mf('moderation.setup.start', { channel: musicChannel.id }),
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
		if (!musicChannel || musicChannel.type != ChannelType.GuildText) {
			interaction.followUp({
				content: i18n.__('moderation.setup.notChannel'),
				ephemeral: true,
			});
			return;
		}

		// Delete existing messages in channel
		await musicChannel?.bulkDelete(100, true);

		const outputQueue = i18n.__('npmessage.emptyQueue');
		const newEmbed = new EmbedBuilder()
			.setColor('#5865F2')
			.setTitle(i18n.__('npmessage.title'))
			.setImage('https://i.imgur.com/TObp4E6.jpg')
			.setFooter({ text: i18n.__('npmessage.footer') });
		const buttons = [
			new ButtonBuilder().setCustomId('playpause').setEmoji('⏯').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('skip').setEmoji('⏭').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId('stop').setEmoji('⏹').setStyle(ButtonStyle.Secondary),
		];
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

		const playingMessage = await musicChannel.send({
			content: outputQueue,
			embeds: [newEmbed],
			components: [row],
		});
		const collector = playingMessage.createMessageComponentCollector({ componentType: ComponentType.Button });

		collector.on('collect', (i) => {
			if (!i.isButton()) return;
			const queue = client.queue.get(i.guildId!); // .songs
			if (!queue) {
				i.reply({ content: i18n.__mf('nowplaying.errorNotQueue'), ephemeral: true });
			}
		});

		// Push to database
		try {
			client.db.create({
				id: guild.id,
				musicChannel: musicChannel.id,
				playingMessage: playingMessage.id,
			});
		} catch(error) {
			console.log(error);
			interaction.editReply('Failed to write to database:\n' + error);
		};

		// Ensure data was written to db
		const checkId = await client.db.findOne({where: {id: guild.id}});

		if (checkId) {
		interaction.followUp({
			content: i18n.__mf('moderation.setup.success', { MUSIC_CHANNEL_ID: checkId.get('musicChannel') }),
			ephemeral: true,
		});
		} else {
			throw new Error('Database was not updated correctly');
		} ;

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
	};
}

module.exports = { 
	data: new SlashCommandBuilder()
	.setName('setup')
	.setDescription(i18n.__('moderation.setup.description').toString())
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.addChannelOption(option => 
		option
			.setName('channel')
			.setDescription(i18n.__('moderation.setup.optionDescription'))
			.setRequired(true)
	),
	
	async execute(interaction: ChatInputCommandInteraction) {
	  if (!interaction.isCommand()) return;
	   let musicChannel = interaction.options.getChannel('channel') as TextChannel;

	   if (musicChannel && musicChannel.type !== ChannelType.GuildText ) return;

		const buttons = [
			new ButtonBuilder()
				.setCustomId('yes')
				.setStyle(ButtonStyle.Success)
				.setLabel(i18n.__('moderation.setup.continue')),
			new ButtonBuilder()
				.setCustomId('no')
				.setStyle(ButtonStyle.Danger)
				.setLabel(i18n.__('moderation.setup.cancel')),
		];
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
		const warning = await interaction.reply({
			content: i18n.__('moderation.setup.warning'),
			ephemeral: true,
			components: [row],
			fetchReply: true,
		});
		if ('awaitMessageComponent' in warning) {
			warning
				.awaitMessageComponent({ componentType: ComponentType.Button, time: 20_000 })
				.then((i) => {
					if (i.customId === 'yes' && interaction.guild) {
						runSetup(i, musicChannel, interaction.client, interaction.guild);
					} else {
						i.reply({ content: i18n.__('moderation.setup.cancelled'), ephemeral: true });
					}
				})
				.catch(console.error);
		}

	},
}



	// guildOnly: true,
	// testOnly: TESTING,
	// slash: true,
	// ownerOnly: true,
	// options: [
	// 	{
	// 		name: 'channel',
	// 		description: i18n.__('moderation.setup.optionDescription'),
	// 		type: 'CHANNEL',
	// 		channelTypes: ['GUILD_TEXT'],
	// 		required: true,
	// 	},
	// ],
// 	async callback({
// 		interaction,
// 		args,
// 		guild,
// 		client,
// 	}: {
// 		interaction: CommandInteraction;
// 		args: string[];
// 		guild: Guild;
// 		client: Client;
// 	}) {
		
// 	},
// } as ICommand;
