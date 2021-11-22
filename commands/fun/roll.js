const prefix = 'X';
module.exports =  {
			name: 'roll',
			category: 'fun',
			// argsType: 'multiple',
			description: `Gives a random number between the specified values \nEx:${prefix}roll <lowest value> <highest value>`,

	callback(message, args) {
		var min = Math.ceil(args[0]);
		var max = Math.floor(args[1]);
		if (!min) {
			var min = 1;
		};
		if (!max) {
			var max = 10;
		};

		const output = Math.floor(Math.random() * (max - min + 1) + min);  // returns a random integer from lowerLimit to upperLimit
		message.channel.send(output);

	}
};