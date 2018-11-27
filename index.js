'use strict';
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');

const http = require('http');
const https = require('https');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/original');
  },
  filename: function(req, file, cb) {
    cb(null, `original:${file.originalname}`);
  },
});
const fs = require('fs');
const upload = multer({storage: storage});
const exif = require('./modules/exif');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const app = express();

const db = require('./modules/database');

const connection = db.connect();

const sharp = require('./modules/sharp');
const HOSTNAME = 'http://localhost:3000';
const path = require('path');
const isLoggedIn = require('./modules/isLoggedInmw');

const sslKey = fs.readFileSync('/etc/pki/tls/private/ca.key');
const sslSert = fs.readFileSync('/etc/pki/tls/certs/ca.crt');

const options = {
    key: sslKey,
    cert: sslSert
};
app.set('trust proxy');

const cb = (results, res) => {
  // console.log(results);
  res.send(results);

};

app.use(express.static('public'));

passport.use(new Strategy(
    function(username, password, cb) {

      connection.query(
          'Select * from media_user where username = ?', username,
          (err, results, fields) => {

            if (results) {
                console.log(results);
                const user = results[0];
                // console.log(`In middleware ${user}`);

                const passportFromDb = results[0].password;
              if (passportFromDb === password) {
                  return cb(null, user);
              } else {
                return cb(null, false);
              }
            }

            if (err) {
              console.log(err);
              return cb(null, false);
            }
          },
      );

    }));

passport.serializeUser(function(user, cb) {
  console.log(`serialize ${user}`);
  cb(null, user.user_id);
});

passport.deserializeUser(function(id, cb) {

  connection.query(
      'SELECT * FROM media_user where user_id = ?', [id],
      function(err, results, fields) {

        if (results) {
          const user = results[0];
          cb(null, user);
        } else {
          cb(err);
        }

      },
  );

});

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: false}));
app.use(require('body-parser').json());
app.use(require('express-session')(
    {secret: 'keyboard cat', resave: false, saveUninitialized: false}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// routes

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/profile', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

// auth routes

app.post('/register', (req, res) => {
  console.log(req.body);

  if (req.body) {
    const userData = [req.body.username, req.body.password];

    connection.execute(
        'Insert INTO media_user (username, password) VALUES (?,?)', userData,
        (err, results, fields) => {
          if (err) {
            console.log(err);
          }
          console.log('saved to db');
          res.redirect('/login');
        },
    );

  }

});

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/login'}),
    function(req, res) {
      res.redirect('/profile');
    });

app.get('/logout',
    function(req, res) {
      req.logout();
      res.redirect('/');
    });

app.post('/upload', upload.single('mediafile'), (req, res, next) => {
  console.log('upload post');

  next();
});

// create thumbnail
app.use('/upload', (req, res, next) => {
  console.log('upload 1');

  console.log(req.file);
  sharp.resizeImg(req.file.path, 200,
      `public/thumbs/thumb_${req.file.originalname}`, next);
});

// create medium image
app.use('/upload', (req, res, next) => {
  console.log('upload post2');

  console.log(req.file);
  sharp.resizeImg(req.file.path, 640,
      `public/medium/medium_${req.file.originalname}`, next);
});

// create coordinates

app.use('/upload', (req, res, next) => {
  console.log('upload post3');

  // console.log('here');
  // exif.getCoordinates(req.file.path).then(coords => {
  //   req.coords = coords;
  //   next();
  // });
  next();

});

// insert to database
app.use('/upload', (req, res, next) => {
  console.log('upload post4');

  const data = [
    req.body.category,
    req.body.title,
    req.body.details,
    `${HOSTNAME}/original/${req.file.originalname}`,
    `${HOSTNAME}/medium/medium_${req.file.originalname}`,
    `${HOSTNAME}/thumbs/thumb_${req.file.originalname}`,
  ];
  db.insert(data, connection, next);

});

// app.use('/upload', (req, res) => {
//
//   // db.select(connection, cb, res);
//
// });

app.get('/getmedia', isLoggedIn, (req, res) => {
  db.select(connection, cb, res);
});

app.get('/delete', (req, res) => {
  console.log(req.query);
  connection.execute(
      `delete from media where title = ? AND details = ? AND category = ?`, [req.query.title, req.query.details, req.query.category]
  )
  res.send('ok')
})
app.post('/update', upload.none(), (req, res) => {
  console.log(req.body);
   connection.execute(
      'UPDATE media SET details = ?, title = ?, category = ? WHERE mId = ?', [req.body.details, req.body.title, req.body.category, req.body.id])
  res.send('ok')

})

// app.listen(3000);

http.createServer((req, res) => {
    res.writeHead(302, { 'location': 'https://' + req.headers.host + '/node' + req.url  });
    res.end();
}).listen(8000);

