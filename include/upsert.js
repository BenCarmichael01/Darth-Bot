/* global __base */
const musicSchema = require(`${__base}schemas/musicSchema`);

module.exports = {
	async upsert({ _id, musicChannel, playingMessage }) {
		try {
			await musicSchema.findOneAndUpdate({
				_id,
			}, {
				_id,
				musicChannel,
				playingMessage,
			}, {
				upsert: true,
			}).then(console.log('upsert completed'));
		} catch (error) {
			console.error(error);
			return 0;
		}
	},
};
