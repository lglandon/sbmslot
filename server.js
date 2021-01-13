let cors = require('cors');
let express = require('express');
let bodyParser = require('body-parser');
let session = require('express-session');

let morgan = require('morgan');
let fs = require('fs');

let gravty = require('./models/gravty');

// invoke an instance of express application.
let app = express();
app.use(cors({ credentials: true }));
app.use(express.static(__dirname + '/public'));

// GLD - Définitions
let cookieId = 'gld_sbmslot';
app.set('port', 9001);

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: cookieId,
    secret: 'ThisIsMySecret!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000*1440
    }
}));

// middleware function to check for session and jwt/user
let sessionChecker = (req, res, next) => {
    if (req.session.jwt) {
        next();
    } else {
        // Get Token
        console.log('Token expire => home');
        res.redirect('/login');
    }
};

app.get('/logout', (req, res) => {
    if (req.session.cookie) {
        res.clearCookie(cookieId);
    }
    res.redirect('/login');
});

app.route('/login')
    .get((req, res) => {
        if (req.session.jwt) {
            res.redirect('/home');
        } else {
            res.sendFile(__dirname + '/public/login.html');
        }
    })
    .post((req, res) => {
        gravty.jwt()
            .then(function (token) {
                if (token !== '') {
                    req.session.regenerate((err) => {
                        if (!err) {
                            req.session.member_id = req.body.member_id;
                            req.session.jwt = token;
                            res.redirect('/home');
                        }
                    });

                }
                else {
                    res.send('Gravty - get Token Error');
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    });


app.route('/')
    .get(sessionChecker, (req, res) => {
        home(req, res);
    })


app.route('/home')
    .get(sessionChecker, (req, res) => {
        home(req, res);
    })

app.route('/slot')
    .get(sessionChecker, (req, res) => {
        homeSlot(req, res);
    })

app.route('/bbar')
    .get(sessionChecker, (req, res) => {
        sendPage(req, res, 'bbar');
    })


app.get('/play', (req, res) => {
    if (!req.session.jwt) {
        // erreur, session terminée !
        let response = {'msg': 'Time out connexion', 'gain': 0, 'gravty': 0, 'reste': 0, 'mymc': 0 + ' € - Pt : ' + 0};
        res.send(JSON.stringify(response));
    } else {
        let line = {'cherry': 0, 'plum': 0, 'orange': 0, 'bell': 0, 'oracle': 0};
        let max = 1;
        let name = '';
        line[req.query.line1]++;
        line[req.query.line2]++;
        line[req.query.line3]++;
        for (let symbol in line) {
            if (line[symbol] > max) {
                name = symbol;
                max = line[symbol];
            }
        }
        let point = Number(req.query.gravty);
        let reste = Number(req.query.reste);
        let mise = Number(req.query.montant);

        let pointGagne = Math.trunc((mise + reste) / 3);
        point = point + pointGagne;
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
        // Appel gravty
        gravty.earn(req.session.jwt, req.session.member_id, mise).then(function (data) {
            if (data !== '') {
                let pointGagne = 0;
                let new_balance = 0;
                for (let balance in data.loyalty_balances) {
                    if (data.loyalty_balances[balance].loyalty_account_id == 1) {
                        pointGagne = data.loyalty_balances[balance].rewarded;
                        new_balance = data.loyalty_balances[balance].new_balance;
                        req.session.point = new_balance;
                    }
                }
                let response = {
                    'msg': msg,
                    'gain': gain,
                    'gravty': Math.round(new_balance).toString(),
                    'reste': reste,
                    'mymc': mise + ' €'
                };
                res.send(JSON.stringify(response));
            }
            else {
                let response = {
                    'msg': 'Time out connexion',
                    'gain': 0,
                    'gravty': 0,
                    'reste': 0,
                    'mymc': 0 + ' € - Pt : ' + 0
                };
                res.send(JSON.stringify(response));
            }
        })
            .catch(function (err) {
                console.log(err);
            });
    }
});

app.get('/pay', (req, res) => {
    if (!req.session.jwt) {
        // erreur, session terminée !
        let response = {'msg': 'Time out connexion', 'gain': 0, 'gravty': 0, 'reste': 0, 'mymc': 0 + ' € - Pt : ' + 0};
        res.send(JSON.stringify(response));
    } else {
        let total = Number(req.query.total);
        let cash = Number(req.query.cash);
        let point = Number(req.query.point);
        let budget = Number(req.query.budget);
        // Appel gravty => burn
        // token, member_id, amountCash, amountPoint, amountBudget
        gravty.burn(req.session.jwt, req.session.member_id, cash, point, budget).then(function (data) {
            if (data !== '') {
                let pointGagne = 0;
                let new_point_balance = 0;
                let new_budget_balance = 0;
                for (let balance in data.loyalty_balances) {
                    if (data.loyalty_balances[balance].loyalty_account_id == 1) {
                        pointGagne = data.loyalty_balances[balance].rewarded;
                        new_point_balance = data.loyalty_balances[balance].new_balance;
                        req.session.point = new_point_balance;
                    }
                    if (data.loyalty_balances[balance].loyalty_account_id == 30) {
                        new_budget_balance = data.loyalty_balances[balance].new_balance;
                        req.session.budget = new_budget_balance;
                    }
                }
                let response = {
                    'error': 0,
                    'msg': 'Burn done',
                    'budget': new_budget_balance.toString(),
                    'point': Math.round(new_point_balance).toString()
                };
                res.send(JSON.stringify(response));
            }
            else {
                let response = {
                    'error': 1,
                    'msg': 'Burn Error',
                    'budget': 0,
                    'point': 0
                };
                res.send(JSON.stringify(response));
            }
        })
            .catch(function (err) {
                console.log(err);
                let response = {
                    'error': 2,
                    'msg': 'System Error',
                    'budget': 0,
                    'point': 0
                };
                res.send(JSON.stringify(response));
            });
    }
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

function home(req, res) {
    if (!req.session.user) {
        gravty.user(req.session.jwt, req.session.member_id).then(function (data) {
            if (data.member_id !== undefined) {
                req.session.user = data;
                for (let balance in data.balances) {
                    if (data.balances[balance].loyalty_account_id == 30)
                        req.session.budget = data.balances[balance].balance;
                    if (data.balances[balance].loyalty_account_id == 1)
                        req.session.point = data.balances[balance].balance;
                }
                sendPage(req, res, 'home');
                // res.send(JSON.stringify(data.user, null, 2));
            } else
                res.send('Gravty - cannot find user ...');
        })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        // res.send('<a href="/logout">Logout</a><hr/>' + JSON.stringify(req.session.user, null, 2));
        sendPage(req, res, 'home');
    }
}

function sendPage(req, res, page) {
    let htmlResponse = fs.readFileSync('./public/' +  page + '.html'  || 'Not found : ' + page + '.html');
    let point = 0.0;
    let budget = 0.0;
    for (let balance in req.session.user.balances) {
        if (req.session.user.balances[balance].loyalty_account_id == 30)
            budget = req.session.user.balances[balance].balance;
        if (req.session.user.balances[balance].loyalty_account_id == 1)
            point = req.session.user.balances[balance].balance;
    }
    htmlResponse = htmlResponse.toString().replace('{{USER}}', req.session.user.member_name);
    htmlResponse = htmlResponse.toString().replace('{{POINT}}', Math.round(req.session.point).toString());
    htmlResponse = htmlResponse.toString().replace('{{POINT_E}}', Math.round(req.session.point /  100).toString());
    htmlResponse = htmlResponse.toString().replace('{{BUDGET}}', req.session.budget.toString());
    res.send(htmlResponse);
}


function homeSlot(req, res) {

    let init = 'let user="' + req.session.user.member_name + '", amount = 1200, gravty = '+ Math.round(req.session.point) + ', reste = 0;'
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

