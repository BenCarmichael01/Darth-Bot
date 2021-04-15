const config = require("../config.json")
module.exports = {
    name: 'prefix',
    aliases: [],
    description: 'TEMPLATE',
    args: true,
    usage: '',
    guildOnly: true,
    execute(message, args) {
        //var parsedConfig = JSON.parse(config);
        message.channel.send("This command currently does not work...");
        console.log(args[0]);
        config.prefix = "args[0]";
        //message.channel.send("Prefix changed to:" + args[0]);
    },
};