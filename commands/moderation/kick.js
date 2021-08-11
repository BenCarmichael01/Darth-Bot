const Commando = require('discord.js-commando');
const i18n = require('i18n');

// TODO add guildLocale to per-server db
i18n.setLocale('en');

module.exports = class KickCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'kick',
			group: 'moderation',
			memberName: 'kick',
			description: i18n.__('moderation.kick.description'),
			clientPermissions: ['KICK_MEMBERS'],
			userPermissions: ['KICK_MEMBERS'],
			args: [{ key: 'member', prompt: i18n.__('moderation.kick.prompt'), type: 'member' }],
		});
	}

	async run(message, args) {
		const { member } = args;
		if (member.kickable) {
			member.kick();
			message.reply(i18n.__mf('moderation.kick.kicked', { member: member.id }));
		} else {
			message.reply(i18n.__mf('moderation.kick.fail', { member: member.id }));
		}
	}
};
