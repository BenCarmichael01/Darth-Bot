const { Command } = require('@sapphire/framework');

module.exports = class rollCommand extends Command {
	constructor(context) {
		super(context, {
			name: 'roll',
			group: 'fun',
			memberName: 'roll',
			argsType: 'multiple',
			description: `Gives a random number between the specified values \nEx:${context.prefix}roll <lowest value> <highest value>`,
		});
	}

	async run(message, args) {
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

	};
};