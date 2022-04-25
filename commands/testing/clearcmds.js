/* eslint-disable no-unused-vars */
/* global __base */

module.exports = {
	name: 'clearcmds',
	description: 'Deletes all guild commands in this guild',
	category: 'testing',
	testOnly: true,
	slash: true,
	permissions: ['ADMINISTRATOR'],

	async callback({ interaction, guild, instance, client }) {
		interaction.reply('Deleting...');
		guild.commands.cache.forEach((value, key) => {
			guild.commands.cache.delete(value);
		});
	},
};
