const fs = require('fs');
const Discord = require('discord.js');
//import prefix and bot token from config file
let rawConfig = fs.readFileSync('./config.json');
let config = JSON.parse(rawConfig);
const prefix = config.prefix;
const MUSIC_CHANNEL_ID = config.MUSIC_CHANNEL_ID;
//const { prefix, MUSIC_CHANNEL_ID } = require("./config.json");
const { error } = require('console');
const ytdl = require('ytdl-core');
const i18n = require("i18n");
const path = require("path");
require('dotenv').config();


//TODO Delete previous message when next song in queue plays or edit the same embed 
const client = new Discord.Client();
client.login();
client.queue = new Map();
client.commands = new Discord.Collection();
//client.on('debug', console.log)
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

//i18n locale config
i18n.configure({
    locales: ["en", "es", "ko", "fr", "tr", "pt_br", "zh_cn", "zh_tw"],
    directory: path.join(__dirname, "locales"),
    defaultLocale: "en",
    objectNotation: true,
    register: global,

    logWarnFn: function (msg) {
        console.log("warn", msg);
    },

    logErrorFn: function (msg) {
        console.log("error", msg);
    },

    missingKeyFn: function (locale, value) {
        return value;
    },

    mustacheConfig: {
        tags: ["{{", "}}"],
        disable: false
    }
});

//Create array of command names from commands directory


var fileSync = function (dir, filelist) {

    if (dir[dir.length - 1] != '/') dir = dir.concat('/')

    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = fileSync(dir + file + '/', filelist);
        }
        else {
            filelist.push(dir + file);
        }
    });
    return filelist;
};

const commandFiles = fileSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`${file}`);
    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}
//Create cooldown collection
const cooldowns = new Discord.Collection();

client.on('message', message => {
    console.log(message);
    //If message doesn't start with prefix or is written by a bot, ignore
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    //Get music channel name from id in config
    const musicChannelName = client.channels.cache.get(MUSIC_CHANNEL_ID)

    //splice off arguments from command and place into an array by spaces
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    //remove first element from array, set to commandName
    const commandName = args.shift().toLowerCase();
    //if command or alias doesnt exist then function exits
    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    ///Guild Only?///
    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('I can\'t execute that command inside DMs!');
    }
    //Is the command music channel only?//
    if (command.isMusic && (message.channel.id != MUSIC_CHANNEL_ID)) {
        return message.reply(i18n.__mf("common.musicOnly", { channel: musicChannelName }));

    }
    ///Usr has perms?///
    if (command.permissions) {
        const authorPerms = message.channel.permissionsFor(message.author);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return message.reply(i18n.__mf("common.musicOnly"));
        }
    }
    ///Does cmd require args, if yes then check they are provided///
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }
    ///////////Setup Cooldown check for commands that require it///////////////////
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    ///Execute command///
    try {
        command.execute(message, args);
    }
    ///Catch any unexpected errors, print to console and notify usr ///ADD LOG FILE///
    catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command, please try again.')
    }
});

///Print when bot ready to console
client.once('ready', () => {
    console.log('Ready!');
});


