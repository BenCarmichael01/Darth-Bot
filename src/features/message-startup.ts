import { npMessage } from '../include/npmessage';
import { LOCALE } from '../include/utils';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, ChannelType, ComponentType, Client } from 'discord.js';
import i18n from 'i18n';
import '../types/types';

if (LOCALE) i18n.setLocale(LOCALE);

async function messageStartup(musicGuilds: Array<string>, musicChannels: Array<string>, client: Client) {


		const outputQueue = i18n.__('npmessage.emptyQueue');
		const newEmbed = new EmbedBuilder()
			.setColor('#5865F2')
			.setTitle(i18n.__('npmessage.title'))
			.setURL('')
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


		
	for (let i = 0; i <= musicChannels.length - 1; i++) {

		let channel = client.guilds.resolve(musicGuilds[i])?.channels.resolve(musicChannels[i]);

		if (channel?.type == ChannelType.GuildText) {
			var playingMessage = await channel.send({ 
				content: outputQueue,
				embeds: [newEmbed],
				components: [row] })
				.then((msg)=> {
					channel.bulkDelete(100, true);
					return msg;
		}); // error handling
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
}
async function isBotInGuild(guildId: string, client: Client) {
	try {
		const guild = await client.guilds.fetch(guildId);
		if (guild != null) {
			return true;
		}
	} catch (error) {
		return false;
	}
}
export default (client: Client) => {
	client.once('dbCached', async () => {
		const musicGuilds: Array<string> = [];
		const musicChannels: Array<string> = [];
		await Promise.all(
			client.db.each(async (guildDb, id) => {
				let inGuild = await isBotInGuild(id, client);
				if (guildDb.musicChannel && inGuild) {
					musicGuilds.push(id);
					musicChannels.push(guildDb.musicChannel);

				}
			}),
		);
		messageStartup(musicGuilds, musicChannels, client);
	});
};

const config = {
	displayName: 'Now Playing Message Startup',
	dbName: 'NPMESSAGE_STARTUP',
};

export { config };
