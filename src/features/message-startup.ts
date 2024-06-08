import { LOCALE } from '../include/utils';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, ChannelType, ComponentType, Client, Message } from 'discord.js';
import i18n from 'i18n';
import '../types/types';

if (LOCALE) i18n.setLocale(LOCALE);

async function isBotInGuild(guildId: string, client: Client) {
	try {
		const guild = await client.guilds.fetch(guildId);
		if (guild != null) {
			return true;
		}
	} catch (error) {
		return false;
	};
}
export default async function (client: Client) {
	
	var musicGuilds: Array<string> = [];
	var musicChannels: Array<string> = [];
	var playingMessages: Array<string> = [];
	const db = await client.db.findAll({ attributes: ['id', 'musicChannel', 'playingMessage'] });
	await Promise.all(
		db.map(async  (instance) => {
			let {id, musicChannel, playingMessage} = instance;
			let inGuild = await isBotInGuild(id.toString(), client);
			if (musicChannel && inGuild) {
				musicGuilds.push(id);
				musicChannels.push(musicChannel);
				playingMessages.push(playingMessage)
			}
	}));

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
	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(...buttons);


	try {
		for (let i = 0; i <= musicChannels.length - 1; i++) {

			let channel = client.guilds.resolve(musicGuilds[i])?.channels.resolve(musicChannels[i]);
			let playingMessage:Message<true>;
			if (channel?.type == ChannelType.GuildText) {
				playingMessage = await channel.messages.edit(playingMessages[i], {
					content: outputQueue,
					embeds: [newEmbed],
					components: [row],
				});
			} else return;

			let collector = playingMessage?.createMessageComponentCollector({ componentType: ComponentType.Button });

			collector.on('collect', (i) => {
				const queue = client.queue.get(i.guildId!);
				if (!queue || queue.songs.length === 0) {
					i.reply({
						content: i18n.__('nowplaying.errorNotQueue'),
						ephemeral: true,
					});
				}
			});
		}
	} catch(error) {
		console.error(error);
	};
};