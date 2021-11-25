/* global __base */
const musicSchema = require(`${__base}schemas/musicSchema`);

module.exports = {
	async findById(_id) {
		const doc = await musicSchema.findById(_id);
		return doc;
	},
};
