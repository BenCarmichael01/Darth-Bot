const { MessageEmbed } = require('discord.js');
var { prefix, MUSIC_CHANNEL_ID, playingMessageId } = require("../config");
const { LOCALE } = require("../util/utils");
const i18n = require("i18n");
i18n.setLocale(LOCALE);
module.exports = {
    async npMessage(message, npSong) {
        //channel limit is currently 30 TODO if music channel is not found in first 30, run again with higher limit
        const musicChannel = await message.guild.channels.cache.get(MUSIC_CHANNEL_ID);
        //console.log(musicChannel);
        //const musicChannel = channels.get(MUSIC_CHANNEL_ID);
        //var song = (song === undefined) ?  : song;
        if (npSong === undefined) {

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
                outputVar[0].edit(newMessage)
                return outputVar
            })
            .then(async outputVar => {
                const filter = (reaction, user) => user.id !== message.client.user.id;
                outputVar[1] = outputVar[0].createReactionCollector(filter, {
                    time: npSong.duration > 0 ? npSong.duration * 1000 : 600000
                });
                return outputVar;
            })
        // console.log(output1);
        return output1
        //outputs an arrray with the first item being the playingMessage and the second being the reaction collector
    }
};

//check if playlist has been added by checking if songs is true or falsey