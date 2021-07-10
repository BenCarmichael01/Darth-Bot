var { prefix } = require("../config");
const Discord = require('discord.js');
const sqlite3 = require('sqlite3');
const sql = require('sqlite');

module.exports = {
    async openDb(file) {
		const db = await sql.open({
			filename: file,
			driver: sqlite3.cached.Database
		}).then((db) => { return db })
		return db
    }
};

//./data/serverData.sqlite