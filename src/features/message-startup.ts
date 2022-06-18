import { npMessage } from '../include/npmessage';
import { LOCALE } from '../include/utils';
import { Client, MessageButton, ButtonInteraction } from 'discord.js';
import i18n from 'i18n';

if (LOCALE) i18n.setLocale(LOCALE);

async function messageStartup(musicGuilds: Array<string>, client: Client) {
	for (let i = 0; i <= musicGuilds.length - 1; i++) {
		const npmessageOutput = await npMessage({
			client,
			guildIdParam: musicGuilds[i],
		});
		let message = npmessageOutput.npmessage;
		let collector = npmessageOutput.collector;
		// TODO handle errors properly
		if (!message) {
			console.log('no npmessage found');
			continue;
		}
		if (!collector) {
			console.log('no collector found');
			continue;
		}
		let oldRow = message.components[0];
		for (let i = 0; i < oldRow.components.length; i++) {
			if (oldRow.components[i].customId === 'loop') {
				oldRow.components[i] = new MessageButton()
					.setCustomId('loop')
					.setEmoji('🔁')
					.setStyle('SECONDARY');
			}
		}
		message.edit({ components: [oldRow] });

		collector.on('collect', (i: ButtonInteraction) => {
			const queue = i.client.queue.get(i.guildId!);
			if (!queue) {
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
		await Promise.all(
			client.db.each(async (guildDb, id) => {
				let inGuild = await isBotInGuild(id, client);
				if (guildDb.musicChannel && inGuild) {
					musicGuilds.push(id);
				}
			}),
		);
		messageStartup(musicGuilds, client);
	});
};

const config = {
	displayName: 'Now Playing Message Startup',
	dbName: 'NPMESSAGE_STARTUP',
};

export { config };
