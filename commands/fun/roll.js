module.exports = {
	name: 'roll',
	category: 'fun',
	// argsType: 'multiple',
	description: 'Gives a random number between the specified values',
	expectedArgs: '<lowest value> <highest value>',
	minArgs: 2,
	maxArgs: 2,

	callback({ message, args }) {
		var min = Math.ceil(args[0]) ? Math.ceil(args[0]) : 1;
		var max = Math.floor(args[1]) ? Math.floor(args[1]) : 10;
		const output = Math.floor(Math.random() * (max - min + 1) + min); // returns a random integer from lowerLimit to upperLimit
		message.channel.send(output.toString());
	},
};
