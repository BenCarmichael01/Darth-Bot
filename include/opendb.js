require('module-alias/register');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const sql = require('sqlite');

module.exports = {
	async openDb(file) {
		const db = await sql.open({
			filename: (file ? file : path.resolve('./data/serverData.sqlite')),
			driver: sqlite3.cached.Database,
		}).then((thedb) => thedb);
		return db;
	},
};

// ./data/serverData.sqlite
