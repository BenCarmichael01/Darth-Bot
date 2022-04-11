const i18n = require('i18n');
const { LOCALE } = require(`${__base}/include/utils`);
// TODO add guildLocale to per-server db
i18n.setLocale(LOCALE);

module.exports = {
	name: 'kick',
	category: 'moderation',
	description: i18n.__('moderation.kick.description'),
	// clientPermissions: ['KICK_MEMBERS'],
	permissions: ['KICK_MEMBERS'],
	testOnly: true,
	slash: true,
	options: [
		{
			name: 'member',
			description: 'The member you wish to kick',
			type: 'USER',
			required: true,
		},
	],
	// args: [{ key: 'member', prompt: i18n.__('moderation.kick.prompt'), type: 'member' }],

	callback({ interaction, args }) {
		const { member } = args;
		if (member.kickable) {
			member.kick();
			interaction.reply({
				content: i18n.__mf('moderation.kick.success', { member: member.user.username }),
			});
		} else {
			interaction.reply({
				content: i18n.__mf('moderation.kick.fail', { member: member.user.username }),
			});
		}
	},
};
