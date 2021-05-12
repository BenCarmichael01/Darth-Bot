module.exports = {
    name: 'reload',
    description: 'Reloads the specified command',
    args: true,
    usage: '<command>',
    guildOnly: true,
    execute(message, args) {
        ///Check that arg was passed///
        if (!args.length) return message.channel.send(`You didn't pass any command to reload, ${message.author}!`);
        const commandName = args[0].toLowerCase();
        const command = message.client.commands.get(commandName)
            || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        ///Check that command exists///
        if (!command) return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);
        ///Delete specified command from cache then reload it///
        /*if (command.isMusic) {
            delete require.cache[require.resolve(`./music/${command.name}.js`)];
        }
        if (!command.isMusic) {
            delete require.cache[require.resolve(`./${command.name}.js`)];
        }*/
        try {
            if (command.isMusic) {
                delete require.cache[require.resolve(`./music/${command.name}.js`)];
                var newCommand = require(`./music/${command.name}.js`);
            };
            if (!command.isMusic) {
                delete require.cache[require.resolve(`./${command.name}.js`)];
                var newCommand = require(`./${command.name}.js`);
            };
            message.client.commands.set(newCommand.name, newCommand);
        } catch (error) {
            console.error(error);
            message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
        }
        message.channel.send(`The \`${command.name}\` command was reloaded!`);
    },
};