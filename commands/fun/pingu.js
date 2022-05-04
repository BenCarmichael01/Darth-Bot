// const oneLine = require('common-tags').oneLine;
module.exports = {
	name: 'pingu',
	category: 'fun',
	description: 'Ping Pong',

	callback({ message }) {
		message.channel.send('Pong');
	},
};

