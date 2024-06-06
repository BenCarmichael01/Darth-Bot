import mongoose from 'mongoose';
import { IMusData } from 'src/types/types';

const musicSchema = new mongoose.Schema<IMusData>({
	_id: String,
	musicChannel: String,
	playingMessage: String,
});
const model = mongoose.model<IMusData>('musicData', musicSchema, 'musicData');
export default model;
