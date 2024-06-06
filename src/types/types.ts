import * as voice from '@discordjs/voice';
import { Snowflake } from 'discord-api-types/globals';
import {
	ButtonInteraction,
	Collection,
	CommandInteraction,
	InteractionCollector,
	Message,
	ReactionCollector,
	SlashCommandBuilder,
	TextBasedChannel,
	VoiceBasedChannel,
} from 'discord.js';
import { EventEmitter } from 'events';
import { Model, ModelStatic } from 'sequelize';
import WOKCommands from 'wokcommands';
declare global {
	var __base: string;
}

declare module 'discord.js' {
	export interface Client {
		queue: Map<Snowflake, IQueue>;
		//db: Collection<Guild['id'], { musicChannel: string; playingMessage: string }>;
		db: ModelStatic<musicGuilds>;
		commands: Collection<CommandName, CustomCommand>;
	}
}
/**
 * The name of the command
 */
export type CommandName = string;

export type CustomCommand = {data: SlashCommandBuilder, execute: (interaction:CommandInteraction) => null};
	
export declare interface CustomConnection {
	on(event: 'setup', listener: (name: string) => void): this;
	on(event: string, listener: Function): this;
}
export class CustomConnection extends EventEmitter {}

export declare interface CustomPlayer {
	on(event: 'jump', listener: (name: string) => void): this;
	on(event: string, listener: Function): this;
}
export class CustomPlayer extends EventEmitter {}

export interface IQueue {
	textChannel: TextBasedChannel;
	collector: InteractionCollector<ButtonInteraction<"cached">> | null;
	voiceChannel: VoiceBasedChannel;
	connection: voice.VoiceConnection;
	player: (CustomPlayer & voice.AudioPlayer) | null;
	timeout: NodeJS.Timeout | null;
	songs: Array<Isong>;
	loop: boolean;
	playing: boolean;
}

export interface Isong {
	title: string;
	url: string;
	thumbUrl: string;
	duration: number;
}

export interface IMusData {
	_id: string;
	musicChannel: string;
	playingMessage: string;
}

export type playArgs = {
	song: Isong;
	message?: Message;
	interaction?: CommandInteraction | ButtonInteraction;
};
export type playCmdArgs = {
	message?: Message;
	interaction?: CommandInteraction;
	args: Array<string>;
	prefix: string;
	instance: WOKCommands;
};

export class musicGuilds extends Model {
	declare id: string;
	declare musicChannel: string;
	declare playingMessage: string;
}