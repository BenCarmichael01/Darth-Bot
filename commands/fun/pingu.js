const { Command } = require('@sapphire/framework');
// const oneLine = require('common-tags').oneLine;
module.exports = {
			name: 'pingu',
			category: 'fun',
			description: 'Ping Pong',


	callback(message) {
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
