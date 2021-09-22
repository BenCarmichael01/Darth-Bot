const Commando = require('discord.js-commando')

module.exports = class tempCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'temp',
			aliases: [],
			group: 'moderation',
			memberName: 'temp',
			description: 'TEMP',
			guildOnly: 'true',
			argsType: 'multiple',
			hidden: 'false',
			nsfw: 'false',
			userPermissions: '',
			ownerOnly: 'false'
		})
	};
	async run(message, args) {

	};
}