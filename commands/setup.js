const { mutate } = require("array-move");
const { Channel } = require("discord.js");
const Discord = require("discord.js");
const client = new Discord.Client();
const editJsonFile = require("edit-json-file");
const fs = require("fs");
const i18n = require("i18n");
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

                //console.log(channelTag);
                config = editJsonFile(`./config.json`);
                config.set("MUSIC_CHANNEL_ID", channelTag);
                config.save()
                //console.log(config.toObject());

                delete require.cache[require.resolve(`../config.json`)];

                var { prefix, token, MUSIC_CHANNEL_ID } = require(`../config.json`);
                if (MUSIC_CHANNEL_ID == channelTag) {
                    message.channel.send(`The music channel has been set to <#${MUSIC_CHANNEL_ID}>`)
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
        //config = editJsonFile(`./config.json`, { autosave: true });


        var musicChannel = message.guild.channels.cache.get(MUSIC_CHANNEL_ID);
        //Create base now playing message. TODO change to embed and check scope of playingMessage so it can be edited in the play.js file
        try {
            var npMessage = new Discord.MessageEmbed()
                .setColor('#5865F2')
                .setTitle("🎶 Nothing is playing")
                //.setURL("")
                //.setAuthor(args[3], args[4], args[5])
                //.setDescription(args[6])
                //.attachFiles(['./media/grogu.jpg'])
                .setImage('https://i.imgur.com/TObp4E6.jpg')
                .setFooter(`The prefix for this server is ${prefix}`);
                /*.addFields(
                    { name: args[8], value: args[9] },
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Inline field title', value: 'Some value here', inline: true },
                    { name: 'Inline field title', value: 'Some value here', inline: true },
                )*/
                //.addField('Inline field title', 'Some value here', true)
                //.setImage(args[10])
                //.setTimestamp()
            //TODO run npmessage module after message created so collector works
            var playingMessage = await musicChannel.send(npMessage);
            await playingMessage.react("⏭");
            await playingMessage.react("⏯");
            await playingMessage.react("🔇");
            await playingMessage.react("🔉");
            await playingMessage.react("🔊");
            await playingMessage.react("🔁");
            await playingMessage.react("⏹");

            config = editJsonFile(`./config.json`);
            config.set("playingMessageId", playingMessage.id);
            config.save();
        } catch (error) {
            console.error(error);
        }

    }
};
