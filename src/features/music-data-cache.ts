import discordjs from 'discord.js';
import model from '../schemas/musicSchema';

export default async (client:discordjs.Client) => {
	const docs = await model.find();
	docs.forEach((guild) => {
		const id = guild._id;
		const { musicChannel, playingMessage } = guild
		const cache = { musicChannel, playingMessage };
		client.db.set(id, cache);
	});
	client.emit('dbCached');
};
export const config = {
	displayName: 'Database Cache',
	dbName: 'MUSIC_DATA_CACHE',
};
