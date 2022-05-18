import { Collection, Guild } from "discord.js";
declare module "discord.js" {
	export interface Client {
	queue: Map<String, any>,
    db: Collection<Guild[ "id" ], {musicChannel: string, playingMessage: string}>
  }
}