/* eslint-disable no-unused-vars */
/* global __base */

module.exports = {
	name: 'throw',
	description: 'throws unhandled error to crash the bot',
	category: 'testing',
	testOnly: true,
	ownerOnly: true,
	permissions: ['ADMINISTRATOR'],
	async callback() {
		throw console.error();
	},
};

