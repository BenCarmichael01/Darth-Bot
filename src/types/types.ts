import * as voice from '@discordjs/voice';
import { Snowflake } from 'discord-api-types/globals';
import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	Client,
	ClientOptions,
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
import { Model, ModelStatic, STRING, Sequelize } from 'sequelize';
import WOKCommands from 'wokcommands';
import { YoutubeThumbnail } from 'youtube.ts';
declare global {
	var __base: string;
}

declare module 'discord.js' {
	export interface Client  {
		queue: Map<Snowflake, IQueue>;
		//db: Collection<Guild['id'], { musicChannel: string; playingMessage: string }>;
		db: ModelStatic<musicGuilds>;
		commands: Collection<CommandName, Command>;
	}
}

export class myClient extends Client {
	public queue: Collection<string, IQueue>;
	public commands: Collection<Snowflake, Command>;
	public db: ModelStatic<musicGuilds>;

	constructor(options: ClientOptions) {
		super(options);
		this.commands =  new Collection();
		this.queue = new Collection();
		this.db = this.createDatabase();
	}

	private createDatabase() {
		// create sequelize db, writing to sqlite file
		const sequelize = new Sequelize('database', 'user', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			// SQLite only
			storage: 'database.sqlite',
		});
	
		 const db = sequelize.define('musicGuilds', {
			id: {
				type: STRING,
				unique: true,
				primaryKey: true,
			},
			musicChannel: {
				type: STRING,
				allowNull: false,	
			},
			playingMessage: {
				type: STRING,
				allowNull: false,
			}
		}) as ModelStatic<musicGuilds>;
		return db;
		// casting since it seems like define() will always return ModelCtor... type 
	};
}

/**
 * The name of the command
 */
export type CommandName = string;

export interface Command  {data: SlashCommandBuilder, execute(interaction:ChatInputCommandInteraction): Promise<void>};
	
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
	thumbUrl: string | YoutubeThumbnail["url"];
	duration: number;
}

export interface IMusData {
	_id: string;
	musicChannel: string;
	playingMessage: string;
}

export type playArgs = {
	song: Isong;
	interaction: ChatInputCommandInteraction | ButtonInteraction;
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