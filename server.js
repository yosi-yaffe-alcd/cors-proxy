require('dotenv').config();
var express = require('express'),
    http = require("https");
    request = require('request'),
    bodyParser = require('body-parser'),
    url = require("url"),
    app = express();
    
    require('body-parser-xml')(bodyParser);

var myLimit = typeof (process.env.PAYLOAD_LIMIT) != 'undefined' ? process.env.PAYLOAD_LIMIT : '100kb';
console.log('Using limit: ', myLimit);

//app.use(bodyParser.json({ limit: myLimit }));
app.use(bodyParser.xml({
    limit: myLimit, // Reject payload bigger than 1 MB
    xmlParseOptions: {
      normalize: true, // Trim whitespace inside text nodes
      normalizeTags: false, // Transform tags to lowercase
      explicitArray: false, // Only put nodes in array if >1
      type : ['text/xml;charset=UTF-8','/xml','+xml']
    }}));

app.all('*', function (req, res, next) {

    if (process.env.DEBUG_REQ) { console.log('### req: ', { url: req.url, method: req.method }) }
    if (process.env.DEBUG_REQ_HEADERS) { console.log('### req headers: ', req?.headers) }
    if (process.env.DEBUG_REQ_BODY) { console.log('### req body: ', req?.body) }
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

        var options = {
            proxy: process.env.QUOTAGUARDSTATIC_URL,
            url: targetURL + req.url,
            method: req.method,
            body: req.body,
            headers: req.headers
        };

        options = {
            proxy: process.env.QUOTAGUARDSTATIC_URL,
            url: targetURL + req.url,
            method: req.method,
        };

        console.log('### request : ', options);

        /*request({}, 
            function (error, response, body) {
                if (error) {
                    console.log('### res error: ', error)
                }
                //console.log(body);
                if (process.env.DEBUG_RES) { console.log('### response: ', response) }
                if (process.env.DEBUG_RES_BODY) { console.log('### res body: ', body) }
            }).pipe(res);*/
        
    }
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function () {
    console.log('Proxy server listening on port ' + app.get('port'));
});