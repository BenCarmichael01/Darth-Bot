var { prefix } = require("../config");
const Discord = require('discord.js');
const sqlite3 = require('sqlite3');
const sql = require('sqlite');

module.exports = {
    async openDb(file) {
        const db = await sql.open({
            filename: file,
            driver: sqlite3.cached.Database
        })
        return db
    }
};
//npSong.duration > 0 ? npSong.duration * 1000 : 600000
//check if playlist has been added by checking if songs is true or falsey