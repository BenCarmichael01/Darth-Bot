var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "jacques",
    password: "Kotl!n@84"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});