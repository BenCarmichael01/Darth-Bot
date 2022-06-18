import musicSchema from '../schemas/musicModel';

/**
 *Takes an id string and returns the corresponding entry from the musicData MongoDB table
 * @param {String} _id
 * @returns {musicDocument} the DB entry
 */
export default async function findById(_id: string): Promise<any> {
	const doc = await musicSchema.findById(_id);
	return doc;
}
