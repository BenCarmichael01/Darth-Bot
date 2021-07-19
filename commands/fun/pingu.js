const Commando = require('discord.js-commando');
//const oneLine = require('common-tags').oneLine;
module.exports = class pinguCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'pingu',
			group: 'fun',
			memberName: 'pingu',
			description: 'Ping Pong',
			/*args: [
				{
					key: 'numbers',
					label: 'number',
					prompt: 'What numbers would you like to add? Every message you send will be interpreted as a single number.',
					type: 'float',
					infinite: true
				}
			]*/
		});
	};
	async run(message, args) {
		message.channel.send('Pong');
	};
	/*{
    name: 'ping',
    description: 'Ping!',
    args: false,
    cooldown: 5,
    usage: 'Ping!',
    guildOnly: false,
    execute(message, args) {
        message.channel.send('Pong');
    },*/
};