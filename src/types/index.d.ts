import * as voice from '@discordjs/voice';
import { Snowflake } from 'discord-api-types/globals';
import {
	ButtonInteraction,
	Collection,
	CommandInteraction,
	Guild,
	InteractionCollector,
	Message,
} from 'discord.js';
import WOKCommands from 'wokcommands';
declare global {
	var __base: string;
}

declare module 'discord.js' {
	export interface Client {
		queue: Map<Snowflake, IQueue>;
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
	collector: InteractionCollector | null;
	voiceChannel: discordjs.VoiceBasedChannel;
	connection: voice.VoiceConnection;
	player: (CustomPlayer & voice.AudioPlayer) | null;
	songs: Array<ISong>;
	loop: boolean;
	playing: boolean;
}

export interface Isong {
	title: string;
	url: string;
	thumbUrl: string;
	duration: number;
}

export type playArgs = {
	song: Isong;
	message?: Message;
	interaction?: CommandInteraction | ButtonInteraction;
};
export type playCmdArgs = {
	message?: discordjs.Message;
	interaction?: CommandInteraction;
	args: Array<string>;
	prefix: string;
	instance: WOKCommands;
	// TODO reference wok instance above
};

