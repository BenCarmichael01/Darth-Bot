const { mutate } = require("array-move");
const { Channel } = require("discord.js");
const Discord = require("discord.js");
const client = new Discord.Client();
const editJsonFile = require("edit-json-file");
const fs = require("fs");
const i18n = require("i18n");
const sqlite3 = require('sqlite3').verbose();
const sql = require('sqlite');
const { npMessage } = require("../include/npmessage");
//const { playingMessageId, MUSIC_CHANNEL_ID } = require("../util/utils");
var { prefix } = require('../config');
const { MSGTIMEOUT } = require("../util/utils");
module.exports = {
	name: "setup",
	aliases: [],
	description: "Setup the channel for music commands",
	args: true,
	usage: "#<music_channel>",
	guildOnly: true,
	async execute(message, args) {
		var channelTag = args[0];
		channelTag = JSON.stringify(channelTag).replace(/[""#<>]/g, "");

		if (message.guild.channels.cache.get(channelTag)) {
			try {
				db = await sql.open({
					filename: './data/serverData.sqlite',
					driver: sqlite3.cached.Database
				}).then((db) => { return db })

				//Create nowplaying message to be pushed to channel
				var musicChannel = message.guild.channels.cache.get(channelTag);
				outputQueue = "There is nothing in the queue right now"
				var newEmbed = new Discord.MessageEmbed()
					.setColor('#5865F2')
					.setTitle("🎶Nothing is playing right now")
					.setImage('https://i.imgur.com/TObp4E6.jpg')
					.setFooter(`The prefix for this server is ${prefix}`);

				var playingMessage = await musicChannel.send(outputQueue, newEmbed);
				await playingMessage.react("⏭");
				await playingMessage.react("⏯");
				await playingMessage.react("🔇");
				await playingMessage.react("🔉");
				await playingMessage.react("🔊");
				await playingMessage.react("🔁");
				await playingMessage.react("⏹");
				//Creates temp collector to remove reactions before bot restarts and uses the one in "on ready" event
				const filter = (reaction, user) => user.id !== message.client.user.id;
				collector = playingMessage.createReactionCollector(filter);
				collector.on("collect", (reaction, user) => {

					var queue = reaction.message.client.queue.get(reaction.message.guild.id)//.songs
					if (!queue) {
						reaction.users.remove(user).catch(console.error)

						reaction.message.channel.send(i18n.__mf("nowplaying.errorNotQueue"))
							.then(msg => {
								msg.delete({ timeout: MSGTIMEOUT })
							}).catch(console.error);
					};
				})
				//Updates db entry for server if exists, if not then it creates one
				await db.run(`UPDATE servers SET channelId=${channelTag}, playingMessageId=${playingMessage.id} WHERE guildId=${message.guild.id};`)
					.then(async (rows) => {
						console.log(rows.changes);
						if (rows.changes == 0) {
							await db.run(`INSERT INTO servers(guildId, channelId, playingMessageId) VALUES (${message.guild.id}, ${channelTag}, ${playingMessage.id})`);
						}
					})


				var MUSIC_CHANNEL_ID = (await db.get(`SELECT channelId FROM servers WHERE guildId='${message.guild.id}'`)).channelId

				if (MUSIC_CHANNEL_ID == channelTag) {
					message.channel.send(`The music channel has been set to <#${MUSIC_CHANNEL_ID}> \n Setup Complete!`)
				}
			}
			catch (error) {
				console.error(error)
				message.channel.send("Sorry there has been an error.")
			}
		}
		else {
			message.channel.send("Sorry, that is not a valid channel. Please tag the channel: #<music_channel>")
			return
		}
	}
};
