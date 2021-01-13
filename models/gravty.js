let needle =require('needle');

async function getJWT()
{
    let token = '';
    let body  = JSON.stringify({"username":"gravty-uat-integration@lji.io","password":"nlDgAOa3M"});
    await needle(
        'post',
        'https://api.demov2.gravtyshow.tech/v1/login/https://api.demov2.gravtyshow.tech/v1/login/',
        body,
        {
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'JhKg9nQFBzaju51BZphcc7wiGFuaY79a18sT6eat'
            }

        }).then(function (resp) {
        if (resp.statusCode == "200") {
            token = resp.body.token;
        } else {
            console.log('Code : ' + resp.statusCode);
        }
    })
        .catch(function (err) {
            console.log(err);
        });
    console.log('NEW Token : ' + token);
    return token;
}

async function getUser(token, user)
{
    let data = {};
    await needle(
        'get',
        'https://api.demov2.gravtyshow.tech/v1/members/data/' + user,
        {
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'JhKg9nQFBzaju51BZphcc7wiGFuaY79a18sT6eat',
                'Authorization': 'JWT ' + token
            }

        }).then(function (resp) {
        if (resp.statusCode == "200") {
            console.log(JSON.stringify(resp.body.data, null, 2));
            data = resp.body.data;
        } else {
            console.log('Code : ' + resp.statusCode);
        }
    })
        .catch(function (err) {
            console.log(err);
        });
    return data;
}

async function earnSlot(token, member_id, amount)
{
    let data = '';
    let body =  JSON.stringify(
        {
            "h_program_id":32,
            "h_bit_date": new Date().toISOString(),
            "h_member_id":member_id,
            "h_bit_category":"ACCRUAL",
            "h_bit_type":"BET",
            "h_sponsor_id":24,
            "h_location":"HDPMCDF",
            "h_bit_amount":amount,
            "h_bit_currency":"EUR",
            "payment_details":
                [
                    {
                        "amount":amount,
                        "payment_method":"SBMC"
                    }
                    ],
            "lines":[
                {
                    "l_amount":amount,
                    "l_item_sequence":"1",
                    "l_product_external_id":"MCRSM"
                }
                ]
            }
        );
    await needle(
        'post',
        'https://api.demov2.gravtyshow.tech/v1/bits/',
        body,
        {
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'JhKg9nQFBzaju51BZphcc7wiGFuaY79a18sT6eat',
                'Authorization': 'JWT ' + token
            }

        }).then(function (resp) {
        if (resp.statusCode == "201") {
            console.log(JSON.stringify(resp.body, null, 2));
            data = resp.body;
        } else {
            console.log('Code : ' + resp.statusCode);
            console.log(JSON.stringify(resp.body, null, 2));
        }
    })
        .catch(function (err) {
            console.log(err);
        });
    return data;
}


async function burnPoint(token, member_id, amountCash, amountPoint, amountBudget)
{
    let data = '';
    let total = amountCash + amountPoint + amountBudget;
    let body =  JSON.stringify(
        {
            "h_program_id": 32,
            "h_bit_date": new Date().toISOString(),
            "h_member_id":member_id,
            "h_bit_category": "ACCRUAL",
            "h_bit_type": "DINING",
            "h_sponsor_id": 24,
            "h_location": "MCOS",
            "h_bit_amount": total,
            "h_bit_currency": "EUR",
            "payment_details": [
                {
                    "amount": amountCash,
                    "payment_method": "CASH"
                },
                {
                    "amount": amountPoint,
                    "payment_method": "PMYT"
                },
                {
                    "amount": amountBudget,
                    "payment_method": "BGINV"
                }
            ],
            "lines": [
                {
                    "l_amount": total,
                    "l_item_sequence": "1",
                    "l_product_external_id": "CHM682"
                }
            ]
        }
    );
    await needle(
        'post',
        'https://api.demov2.gravtyshow.tech/v1/bits/',
        body,
        {
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'JhKg9nQFBzaju51BZphcc7wiGFuaY79a18sT6eat',
                'Authorization': 'JWT ' + token
            }

        }).then(function (resp) {
        if (resp.statusCode == "201") {
            console.log(JSON.stringify(resp.body, null, 2));
            data = resp.body;
        } else {
            console.log('Code : ' + resp.statusCode);
            console.log(JSON.stringify(resp.body, null, 2));
        }
    })
        .catch(function (err) {
            console.log(err);
        });
    return data;
}

exports.jwt = getJWT;
exports.user = getUser;
exports.earn = earnSlot;
exports.burn = burnPoint;