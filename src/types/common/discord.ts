import { Collection, Guild } from "discord.js";
declare module "discord.js" {
	export interface Client {
	queue: Map<any, any>,
    db: Collection<Guild[ "id" ], any>
  }
}