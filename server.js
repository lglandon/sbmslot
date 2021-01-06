let cors = require('cors');
let express = require('express');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let session = require('express-session');

let morgan = require('morgan');
let fs = require('fs');
const multer = require('multer');
const path = require('path');

let gravty = require('./models/gravty');

// invoke an instance of express application.
let app = express();
app.use(cors({ credentials: true }));
app.use(express.static(__dirname + '/public'));

// GLD - Définitions
let cookieId = 'gld_sbmslot';
let uploadPath = __dirname + '/uploads/';
app.set('port', 9001);

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));
// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: cookieId,
    secret: 'ThisIsMySecret!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 14400000
    }
}));

const xlsStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadPath);
    },
    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

app.get('/', (req, res) => {
    if (!req.cookies[cookieId] && !req.session.jwt) {
        console.log('First Appel');
        gravty.jwt().then(function (token) {
            if (token !== '') {
                req.session.jwt = token;
                homeSlot(req, res);
            }
            else
                res.send('Gravty Connection Error');
        })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        homeSlot(req, res);
    }
});

app.get('/play', (req, res) => {
    let line = { 'cherry': 0, 'plum':0, 'orange': 0, 'bell':0, 'oracle':0 };
    let max = 1;
    let name = '';
    line[req.query.line1] ++;
    line[req.query.line2] ++;
    line[req.query.line3] ++;
    for (let symbol in line) {
        if (line[symbol] > max) {
            name = symbol;
            max = line[symbol];
        }
    }
    let gravty = Number(req.query.gravty);
    let reste = Number(req.query.reste);
    let mise = Number(req.query.montant);

    let pointGagne =  Math.trunc((mise + reste) / 3);
    gravty = gravty + pointGagne;
    reste = (mise + reste) - pointGagne * 3;

    let msg = 'Vous avez perdu ...';
    let gain = 0;
    if (max == 2) {
        msg = 'Vous avez gagné ...';
        gain = 5 * mise;
    }
    if (max == 3) {
        msg = 'Vous avez gagné ...';
        gain = 20 * mise;
    }
    let response = {'msg': msg, 'gain': gain, 'gravty': gravty, 'reste': reste, 'mymc': mise + ' € - Pt : ' + pointGagne};
    res.send(JSON.stringify(response));
});


// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!")
});


// start the express server
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));

function getInitValue( id ) {
    return 'let user="Laurent GLANDON",  amount = 400, gravty = 230, reste = 0;';
}

function homeSlot(req, res) {
    // Initialisation du jeu
    let init = 'let user="Olivier BERTRAND", amount = 1200, gravty = 100, reste = 0;'
    if (req.query.id !== undefined) {
        init = getInitValue(req.query.id)
    }
    let htmlResponse = fs.readFileSync('./public/slot.html'  || '');
    htmlResponse = htmlResponse.toString().replace(
        '{{INIT}}',
        init
    );
    res.send(htmlResponse);
}