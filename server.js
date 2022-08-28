var express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    app = express();

var myLimit = typeof (process.env.PAYLOAD_LIMIT) != 'undefined' ? process.env.PAYLOAD_LIMIT : '100kb';
console.log('Using limit: ', myLimit);

app.use(bodyParser.json({ limit: myLimit }));

app.all('*', function (req, res, next) {

    if (process.env.DEBUG_REQ) { console.log({ url: req.url, method: req.method }) }
    if (process.env.DEBUG_HEADERS) { console.log(req?.headers) }
    if (process.env.DEBUG_BODY) { console.log(req?.body) }
    // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
    //res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    //res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));
    var proxyToken = req.header('Proxy-Token');
    if (proxyToken !== process.env.PROXY_TOKEN) {
        res.send(401, { error: 'Proxy-Token header missing or incorrect' });
    }

    if (req.method === 'OPTIONS') {
        // CORS Preflight
        res.send();
    } else {
        var targetURL = req.header('Target-URL');
        if (!targetURL) {
            res.send(500, { error: 'There is no Target-Endpoint header in the request' });
            return;
        }
        request({ url: targetURL + req.url, method: req.method, json: req.body, headers: { 'Authorization': req.header('Authorization') } }, //{ 'Authorization': req.header('Authorization') }
            function (error, response, body) {
                if (error) {
                    console.error('error: ' + response?.statusCode)
                }
                //console.log(body);
            }).pipe(res);
    }
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function () {
    console.log('Proxy server listening on port ' + app.get('port'));
});