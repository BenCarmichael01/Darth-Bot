import { npMessage } from '../include/npmessage';
import { LOCALE } from '../include/utils';
import discordjs from 'discord.js';
import i18n from 'i18n';

if (LOCALE) i18n.setLocale(LOCALE);

async function messageStartup(musicGuilds:Array<string>, client:discordjs.Client) {
	for (let i = 0; i <= musicGuilds.length - 1; i++) {
		const npMessageObj = [];
		const collectors = [];
		const npmessageOutput = await npMessage({
			client,
			guildIdParam: musicGuilds[i],
		});
		npMessageObj[i] = npmessageOutput.npmessage;
		collectors[i] = npmessageOutput.collector;
		if (!collectors[ i ] || !npMessageObj[ i ]) continue;
		let oldRow = npMessageObj[i]!.components[0];
		for (let i = 0; i < oldRow.components.length; i++) {
			if (oldRow.components[i].customId === 'loop') {
				oldRow.components[i] = new discordjs.MessageButton()
					.setCustomId('loop')
					.setEmoji('🔁')
					.setStyle('SECONDARY');
			}
		}
		npMessageObj[i]!.edit({ components: [oldRow] });

		collectors[i]!.on('collect', (i) => {
			if (!i.isButton()) return;
			if (!i.guildId) {
				i.reply({
					content: i18n.__('common.noSetup'),
					ephemeral: true,
				})
				return;
			}
			const queue = i.client.queue.get(i.guildId);
			if (!queue) {
				i.reply({
					content: i18n.__('nowplaying.errorNotQueue'),
					ephemeral: true,
				});
			}
		});
	}
}
module.exports = (client:discordjs.Client) => {
	client.on('dbCached', () => {
		let musicGuilds:Array<string> = [];
		client.db.each((guildDb, id) => {
			if (guildDb.musicChannel) {
				musicGuilds.push(id);
			}
		});
		messageStartup(musicGuilds, client);
	});
};

module.exports.config = {
	displayName: 'Now Playing Message Startup',
	dbName: 'NPMESSAGE_STARTUP',
};
