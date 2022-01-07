/* global __base */
const { findById } = require(`${__base}include/findById`);
const ytdl = require('ytdl-core-discord');

module.exports = {
	name: 'test',
	description: 'test',
	category: 'testing',
	testOnly: true,

	async callback({ message, guild, instance, client }) {
		try {
			const output = await ytdl.getInfo('https://www.youtube.com/watch?v=slZdwc4T89k');
			console.log(output);
		} catch (error) {
			console.error(error);
		}
		message.delete();
	},
};
