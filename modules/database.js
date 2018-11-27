const mysql = require('mysql2');
const sharp = require('./sharp')




const connect = () => {

    // create the connection to database
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
      password: process.env.DB_PASS
    });
}

const select = (connection, callback, res) => {
    // simple query
    connection.query(
        'SELECT * FROM media',
        function(err, results, fields) {
            // console.log(results); // results contains rows returned by server
            // console.log(fields); // fields contains extra meta data about results, if available
            // console.log(err);
            callback(results, res)
        },
    );
}


const insert = (data, connection, callback) => {
    // simple query
    connection.execute(
        'Insert INTO media (category, title, details, original_img, medium_img, thumb_img) VALUES (?,?,?,?,?,?)', data,
        (err, results, fields) => {
            if (err) {
                console.log(err)
            }
            console.log('saved to db')
            callback()
        },
    );
}

module.exports = {
    connect,
    select,
    insert
}