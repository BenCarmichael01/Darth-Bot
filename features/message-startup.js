const { npMessage } = require('../include/npmessage');
const { LOCALE } = require('../include/utils');
const discordjs = require('discord.js');
const i18n = require('i18n');

i18n.setLocale(LOCALE);

async function messageStartup(musicGuilds, client) {
	for (let i = 0; i <= musicGuilds.length - 1; i++) {
		const npMessageObj = [];
		const collectors = [];
		[npMessageObj[i], collectors[i]] = await npMessage({
			client,
			guildIdParam: musicGuilds[i],
		});
		if (!collectors[i] || !npMessageObj[i]) continue;
		let oldRow = npMessageObj[i].components[0];
		for (let i = 0; i < oldRow.components.length; i++) {
			if (oldRow.components[i].customId === 'loop') {
				oldRow.components[i] = new discordjs.MessageButton()
					.setCustomId('loop')
					.setEmoji('🔁')
					.setStyle('SECONDARY');
			}
		}
		npMessageObj[i].edit({ components: [oldRow] });

		collectors[i].on('collect', (i) => {
			if (!i.isButton()) return;
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
module.exports = (client) => {
	client.on('dbCached', () => {
		let musicGuilds = [];
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
