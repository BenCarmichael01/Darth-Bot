/* global __base */
const musicSchema = require(`${__base}schemas/musicSchema`);
const mongoose = require('mongoose');

module.exports = {
	/**
	 *Takes an id string and returns the corresponding entry from the musicData MongoDB table
	 * @param {String} _id
	 * @returns {mongoose.Types.DocumentArray} the DB entry
	 */
	async findById(_id) {
		const doc = await musicSchema.findById(_id);
		return doc;
	},
};
