const { Channel } = require("discord.js");
const editJsonFile = require("edit-json-file");
const fs = require("fs");
module.exports = {
    name: 'setup',
    aliases: [],
    description: 'Setup the channel for music commands',
    args: true,
    usage: '',
    guildOnly: true,
    execute(message, args) {
        var channelTag = args[0]
        channelTag = JSON.stringify(channelTag).replace(/[""#<>]/g, '');
        console.log(channelTag);

        config = editJsonFile(`./config.json`);
        config.set("MUSIC_CHANNEL_ID", channelTag);
        config.save();
        console.log(config.toObject());

        delete require.cache[require.resolve(`../config.json`)];
        var { prefix, token, MUSIC_CHANNEL_ID } = require(`../config.json`);
        //config = editJsonFile(`./config.json`, { autosave: true });
       
        /*
        fs.readFile('./config.json', 'utf8', (err, jsonString) => {
            if (err) {
                console.log("File read failed:", err)
                return
            }
            console.log('File data:', jsonString)
        })*/
    },
};