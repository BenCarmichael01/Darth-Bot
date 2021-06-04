const { MessageEmbed } = require('discord.js');
var { prefix, MUSIC_CHANNEL_ID, playingMessageId } = require("../config");
const { LOCALE } = require("../util/utils");
const i18n = require("i18n");
const Discord = require('discord.js');
i18n.setLocale(LOCALE);
module.exports = {
    async npMessage(message, npSong, newSongs, client) {
        //TODO this searches all channels bot can see, must fix if to be added to more servers. Must be like this so np message can be
        //reset everytime the bot launches also i broke the whole thing trying to reset np message at startup
        if (!message) {
            var musicChannel = await client.channels.cache.get(MUSIC_CHANNEL_ID);
        }
        else if (message) {
            var musicChannel = await message.client.channels.cache.get(MUSIC_CHANNEL_ID);
        }
        if (message !== undefined) {
            var queue = client.queue.get(message.guild.id).songs;
        }
       

        /*
        function generateQueue(message, queue) {
            let outputQueue = [];
            //TODO add queue size to config//
            let k = 10;

            for (let i = 0; i < queue.length; i += 1) {
                const current = queue.slice(i, k);
                let j = i;
                k += 10;

                //const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join("\n");
                currentQueue = current[1].title
                const embed = new MessageEmbed()
                    .setTitle(i18n.__("queue.embedTitle"))
                    .setThumbnail(message.guild.iconURL())
                    .setColor("#F8AA2A")
                    .setDescription(
                        i18n.__mf("queue.embedCurrentSong", { title: queue[0].title, url: queue[0].url, info: info })
                    )
                    .setTimestamp();
                outputQueue.push(currentQueue);
            }

            return outputQueue;
        }*/
        //console.log(generateQueue(message, queue));

        var outputQueue = ""

        if (npSong === undefined) {
            outputQueue = "There is nothing in the queue right now"
            var newMessage = new MessageEmbed()
                .setColor('#5865F2')
                .setTitle("🎶Nothing is playing right now")
                .setURL("")
                //.setAuthor(args[3], args[4], args[5])
                //.setDescription(args[6])
                //.attachFiles(['./media/grogu.jpg'])
                .setImage('https://i.imgur.com/TObp4E6.jpg')
                .setFooter(`The prefix for this server is ${prefix}`);
        }
        else {
            let currentQueue = queue.slice(1, 22);
            
            for (let i = 0; i < currentQueue.length; i++) {
                index = i + 1
                outputQueue = index + "." + currentQueue[i].title + "\n" + outputQueue
            };
            var newMessage = new MessageEmbed()
                .setColor('#5865F2')
                .setTitle(`🎶 Now playing: ${npSong.title}`)
                .setURL(npSong.url)
                //.setAuthor(args[3], args[4], args[5])
                //.setDescription(args[6])
                .setImage(npSong.thumbUrl)
                .setFooter(`The prefix for this server is ${prefix}`);
        };

        
        output1 = await musicChannel.messages.fetch({ limit: 10 })
            .then(async messages => {
                var outputVar = [];
                outputVar[0] = await messages.get(playingMessageId);
                //console.log(outputVar[0]);
                //Change now playing message to match current song
                outputVar[0].edit(outputQueue, newMessage)
                return outputVar
            })
            .then(async outputVar => {
                const filter = (reaction, user) => user.id !== message.client.user.id;
                outputVar[1] = outputVar[0].createReactionCollector(filter, {
                    time: npSong.duration > 0 ? npSong.duration * 1000 : 600000
                });
                return outputVar;
            }).catch(console.error);
        // console.log(output1);
        return output1
        //outputs an arrray with the first item being the playingMessage and the second being the reaction collector
    }
};

//check if playlist has been added by checking if songs is true or falsey