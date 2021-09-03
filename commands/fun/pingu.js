const { Command } = require('@sapphire/framework');
// const oneLine = require('common-tags').oneLine;
module.exports = class pinguCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'pingu',
			group: 'fun',
			memberName: 'pingu',
			description: 'Ping Pong',
		});
	}

	async run(message) {
		message.channel.send('Pong');
	}
	/* {
	name: 'ping',
	description: 'Ping!',
	args: false,
	cooldown: 5,
	usage: 'Ping!',
	guildOnly: false,
	execute(message, args) {
		message.channel.send('Pong');
	}, */
};
