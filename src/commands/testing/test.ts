/* eslint-disable no-unused-vars */
/* global __base */

import { ICommand } from 'wokcommands';

export default {
	name: 'test',
	description: 'test',
	category: 'testing',
	testOnly: true,
	ownerOnly: true,
	slash: true,
	permissions: ['ADMINISTRATOR'],

	async callback({ message, guild, instance, client }) {},
} as ICommand;
