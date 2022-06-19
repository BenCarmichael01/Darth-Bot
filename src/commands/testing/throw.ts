import { ICommand } from 'wokcommands';

export default {
	name: 'throw',
	description: 'throws unhandled error to crash the bot',
	category: 'testing',
	testOnly: true,
	ownerOnly: true,
	slash: true,
	permissions: ['ADMINISTRATOR'],
	async callback() {
		throw new Error('Forced Crash');
	},
} as ICommand;
