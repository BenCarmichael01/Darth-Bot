const fs = require('fs');
const Discord = require('discord.js');
//import prefix and bot token from config file
var { prefix, token} = require('./config.json');
const { MSGTIMEOUT } = require("./util/utils");
const { error } = require('console');
const ytdl = require('ytdl-core');
const i18n = require("i18n");
const path = require("path");
require('dotenv').config();
const { npMessage } = require("./include/npmessage");
const sqlite3 = require('sqlite3');
const sql = require('sqlite');

//const { openDb } = require("./include/opendb");




//TODO Delete previous message when next song in queue plays or edit the same embed 
const client = new Discord.Client();
client.login();
client.queue = new Map();
client.commands = new Discord.Collection();
//client.on('debug', console.log)
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

async function openDb(file) {
    db = await sql.open({
        filename: file,
        driver: sqlite3.cached.Database
    })
    return db
}

openDb('./data/serverData.sqlite').then(db => {
    return db;
});


//sql.open('/data/serverData.sqlite');
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

//doing this here fails as there is no message to pass it 


//console.log(client.guilds.cac);



client.on('message', message => {
    //console.log(message);
    //If message doesn't start with prefix or is written by a bot, ignore
    if (message.author.bot) return;
    var MUSIC_CHANNEL_ID = ''
    
    db.get(`SELECT * FROM servers WHERE guildId='${message.guild.id}'`).then( row => {
        //console.log(row.channelId);
        MUSIC_CHANNEL_ID = row.channelId
    })
        .catch(console.error);
    console.log(MUSIC_CHANNEL_ID);
    if (!message.content.startsWith(prefix)) {
        if (message.channel.id !== MUSIC_CHANNEL_ID) {
            return
        }
        else if (message.channel.id === MUSIC_CHANNEL_ID) {
            const args = message.content.trim().split(/ +/);
            
            try {
                client.commands.get("play").execute(message, args);
                return

            }
            ///Catch any unexpected errors, print to console and notify usr ///ADD LOG FILE///
            catch (error) {
                console.error(error);
                message.reply('There was an error trying to execute that command, please try again.').then(msg => {
                    msg.delete({ timeout: MSGTIMEOUT })
                })
                    .catch(console.error);
            } 
        }
    }

    /*if (!message.content.startsWith(prefix) || message.author.bot) {
        if (message.author.id !== client.user.id) {
            if (message.channel.id === MUSIC_CHANNEL_ID) {
                message.delete();
            };
            return;
        };
    };*/
    //console.log("Message content:" + message.content);
   /* if (message.author.id === client.user.id) {
        
    };*/

        //splice off arguments from command and place into an array by spaces
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        //remove first element from array, set to commandName
        const commandName = args.shift().toLowerCase();
        //if command or alias doesnt exist then function exits
        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) {
            //TODO localise//
            message.reply(`That isn't a command! \n Use ${prefix}help to see a list of my commands`).then(msg => {
                msg.delete({ timeout: MSGTIMEOUT })
            })
                .catch(console.error);
            return;
        }
        ///Guild Only?///
        if (command.guildOnly && message.channel.type === 'dm') {
            //TODO localise//
            return message.reply('I can\'t execute that command inside DMs!').then(msg => {
                msg.delete({ timeout: MSGTIMEOUT })
            })
                .catch(console.error);
        }
        //Is the command music channel only?//
        const musicChannelName = message.guild.channels.cache.get(MUSIC_CHANNEL_ID).id
        if (command.isMusic && (message.channel.id != MUSIC_CHANNEL_ID)) {
            return message.reply(i18n.__mf("common.musicOnly", { channel: musicChannelName })).then(msg => {
                msg.delete({ timeout: MSGTIMEOUT })
            })
                .catch(console.error);;

        }
        ///Usr has perms?///
        if (command.permissions) {
            const authorPerms = message.channel.permissionsFor(message.author);
            if (!authorPerms || !authorPerms.has(command.permissions)) {
                return message.reply(i18n.__mf("common.musicOnly")).then(msg => {
                    msg.delete({ timeout: MSGTIMEOUT })
                })
                    .catch(console.error);
            }
        }
        ///Does cmd require args, if yes then check they are provided///
        if (command.args && !args.length) {
            let reply = `You didn't provide any arguments`;

            if (command.usage) {
                reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
            }
            return message.channel.send(reply).then(msg => {
                msg.delete({ timeout: (MSGTIMEOUT + 5000)})
            })
                .catch(console.error);;
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
                return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`).then(msg => {
                    msg.delete({ timeout: MSGTIMEOUT })
                })
                    .catch(console.error);
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        ///Execute command///
        try {
            command.execute(message, args);
            return;
        }
        ///Catch any unexpected errors, print to console and notify usr ///ADD LOG FILE///
        catch (error) {
            console.error(error);
            message.reply('There was an error trying to execute that command, please try again.').then(msg => {
                msg.delete({ timeout: MSGTIMEOUT })
            })
                .catch(console.error);
        }
   
});

///Print when bot ready to console
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.username} (${client.user.id})`);

    
    db.exec('CREATE TABLE IF NOT EXISTS servers (guildId varchar(18) NOT NULL PRIMARY KEY, channelId varchar(18), playingMessageId varchar(18))');
    

    var [npMessageObj, collector] = await npMessage(undefined, undefined, client);
   
    collector.on("collect", (reaction, user) => {
        var queue = npMessageObj.client.queue.get(npMessageObj.guild.id)//.songs
        if (!queue) {
            reaction.users.remove(user).catch(console.error)
            npMessageObj.channel.send(i18n.__mf("nowplaying.errorNotQueue"))
                .then(msg => {
                    msg.delete({ timeout: MSGTIMEOUT })
                }).catch(console.error);   
        };
    })

});


