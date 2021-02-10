module.exports = {
    name: 'roll',
    aliases: ['dice', 'randInt'],
    description: 'Gives a random number between the specified values',
    args: false,
    usage: '<lowest value> <highest value>',
    guildOnly: false,
    execute(message, args) {
        var min = Math.ceil(args[0]);
        var max = Math.floor(args[1]);
        if (!min) {
           var min = 1;
        };
        if (!max) {
            var max = 10;
        };

        const output = Math.floor(Math.random() * (max - min + 1) + min);  // returns a random integer from lowerLimit to upperLimit
        message.channel.send(output);
    },
};