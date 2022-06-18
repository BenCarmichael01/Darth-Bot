import { IMusData } from 'src/types';
import model from '../schemas/musicSchema';

/**
 *
 * @param {Object} args
 * @param {String} args._id
 * @param {String} args.musicChannel
 * @param {String} args.playingMessage
 * @returns the updated doc on success, 0 on failure
 */
export async function upsert({
	_id,
	musicChannel,
	playingMessage,
}: {
	_id: string;
	musicChannel: string;
	playingMessage: string;
}): Promise<IMusData | undefined> {
	try {
		const doc = await model.findOneAndUpdate(
			{
				_id,
			},
			{
				_id,
				musicChannel,
				playingMessage,
			},
			{
				new: true,
				upsert: true,
			},
		);
		return doc;
	} catch (error) {
		console.error(error);
		return;
	}
}
