/* global __base */
const musicSchema = require(`${__base}schemas/musicSchema`);

module.exports = {
	/**
	 *
	 * @param {Object} args
	 * @param {String} args._id
	 * @param {String} args.musicChannel
	 * @param {String} args.playingMessage
	 * @returns 1 for success, 0 for fail
	 */
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
			});
			return 1;
			// .then(console.log('upsert completed'));
		} catch (error) {
			console.error(error);
			return 0;
		}
	},
};
