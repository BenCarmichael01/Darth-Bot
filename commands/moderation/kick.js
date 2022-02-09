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
	// args: [{ key: 'member', prompt: i18n.__('moderation.kick.prompt'), type: 'member' }],

	callback({ message, args }) {
		const { member } = args;
		if (member.kickable) {
			member.kick();
			message.reply(i18n.__mf('moderation.kick.success', { member: member.user.username }));
		} else {
			message.reply(i18n.__mf('moderation.kick.fail', { member: member.user.username }));
		}
	},
};
