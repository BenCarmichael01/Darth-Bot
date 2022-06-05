import { AudioPlayer, AudioPlayerEvents } from '@discordjs/voice';
import { Collection, CommandInteraction, Guild, Message } from 'discord.js';
declare global {
	var __base: string;
}

declare module 'discord.js' {
	export interface Client {
		queue: Map<String, any>;
		db: Collection<Guild['id'], { musicChannel: string; playingMessage: string }>;
	}
}
// declare module '@discordjs/voice' {
// 	export type CustomAudioPlayerEvents = AudioPlayerEvents & {
// 		queueEnd: (message: string) => Awaited<void>;
// 	};
// 	export type ListenerSignature<L> = {
//     [E in keyof L]: (...args: any[]) => any;
// };

// export type DefaultListener = {
//     [k: string]: (...args: any[]) => any;
// };

// 	export class CustomTypedEmitter<L extends ListenerSignature<L> = DefaultListener> extends TypedEmitter<CustomAudioPlayerEvents> {}
// 	export class CustomAudioPlayer extends AudioPlayer, CustomTypedEmitter{}
// }
export interface IQueue {
	textChannel: discordjs.TextBasedChannel;
	channel: discordjs.VoiceBasedChannel | null;
	connection: voice.VoiceConnection | null;
	player: voice.AudioPlayer | null;
	songs: Array<ISong>;
	loop: boolean;
	playing: boolean;
}

export interface Isong {
	title: string;
	url: string;
	thumbUrl: string;
	duration: string;
}

export type playArgs = {
	song: Isong;
	message: Message;
	interaction: CommandInteraction;
	prefix: string;
};
