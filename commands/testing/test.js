/* global __base */
const { findById } = require(`${__base}include/findById`);

module.exports = {
	name: 'test',
	description: 'test',
	category: 'testing',
	testOnly: true,

	async callback({ message, guild, instance, client}) {
		console.log(guild);
		console.log((instance._prefixes[guild.id]));
	},
};
