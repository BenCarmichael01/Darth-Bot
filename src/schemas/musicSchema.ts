import mongoose from 'mongoose';
interface IMusData {
	_id: string,
	musicChannel: string,
	playingMessage: string,
}

const musicSchema = new mongoose.Schema<IMusData>({
	_id: String,
	musicChannel: String,
	playingMessage: String,
});
const model = mongoose.model<IMusData>('musicData', musicSchema, 'musicData');
export default model;
