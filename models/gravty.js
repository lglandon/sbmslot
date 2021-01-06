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
    return token;
}

exports.jwt = getJWT;