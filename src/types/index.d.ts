import { AudioPlayer, AudioPlayerEvents } from '@discordjs/voice';
import { ButtonInteraction, Collection, CommandInteraction, Guild, Message } from 'discord.js';
import WOKCommands from 'wokcommands';
declare global {
	var __base: string;
}

declare module 'discord.js' {
	export interface Client {
		queue: Map<String, any>;
		db: Collection<Guild['id'], { musicChannel: string; playingMessage: string }>;
	}
}
export declare interface CustomConnection {
	on(event: 'setup', listener: (name: string) => void): this;
	on(event: string, listener: Function): this;
}
export class CustomConnection extends typedEventEmitter {}

export declare interface CustomPlayer {
	on(event: 'jump', listener: (name: string) => void): this;
	on(event: string, listener: Function): this;
}
export class CustomPlayer extends typedEventEmitter {}

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
	interaction: CommandInteraction | ButtonInteraction;
};
export type playCmdArgs = {
	message: discordjs.Message;
	interaction: CommandInteraction;
	args: Array<string>;
	prefix: string;
	instance: WOKCommands;
	// TODO reference wok instance above
};
