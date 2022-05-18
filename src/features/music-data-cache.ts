import discordjs from 'discord.js';
import { find } from '../schemas/musicSchema';

export default async (client:discordjs.Client) => {
	const docs = await find();
	docs.forEach((guild) => {
		const cache = guild._doc;
		const id = cache._id;
		delete cache.__v;
		delete cache._id;
		client.db.set(id, cache);
	});
	client.emit('dbCached');
};
export const config = {
	displayName: 'Database Cache',
	dbName: 'MUSIC_DATA_CACHE',
};
