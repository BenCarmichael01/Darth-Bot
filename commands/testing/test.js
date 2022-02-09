/* eslint-disable no-unused-vars */
/* global __base */
const { findById } = require(`${__base}include/findById`);
const ytdl = require('ytdl-core-discord');

module.exports = {
	name: 'test',
	description: 'test',
	category: 'testing',
	testOnly: true,

	async callback({ message, guild, instance, client }) {
		throw console.error();
	},
};
