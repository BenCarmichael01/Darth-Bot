import { Collection, Guild } from 'discord.js';
declare module 'discord.js' {
	export interface Client {
		queue: Map<String, any>;
		db: Collection<Guild['id'], { musicChannel: string; playingMessage: string }>;
	}
}
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
