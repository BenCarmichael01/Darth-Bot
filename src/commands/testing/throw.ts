import { ICommand } from 'wokcommands';

export default {
	name: 'throw',
	description: 'Throws an uncaught exception to crash the bot',
	category: 'testing',
	testOnly: true,
	ownerOnly: true,
	slash: true,
	permissions: ['ADMINISTRATOR'],
	async callback() {
		throw new Error('Forced Crash');
	},
} as ICommand;
