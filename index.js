const express = require('express');
bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

const { createProxyMiddleware,loggerPlugin,proxyEventsPlugin,errorResponsePlugin,debugProxyErrorsPlugin } = require('http-proxy-middleware');

const app = express();

/*const simpleRequestLogger = (proxyServer, options) => {
    proxyServer.on('proxyReq', (proxyReq, req, res) => {
      console.log(`[HPM] [${req.method}] ${req.url}`); // outputs: [HPM] GET /users
    });
};*/

const options = {
    target: 'https://www.amnet.co.il:8443', // target host with the same base path
    changeOrigin: true, // needed for virtual hosted sites
    ejectPlugins: true,
    plugins: [debugProxyErrorsPlugin, loggerPlugin, errorResponsePlugin, proxyEventsPlugin],
    logger: console,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`proxyReq ${req.method} ${req.url} ${JSON.stringify(req.body)}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`proxyRes ${req.method} ${req.url} ${JSON.stringify(res.body)} ${res.rawBody}`);
    },
    onError: (err, req, res) => {
        console.log(`error ${req.method} ${req.url} ${err}`);
    },
};

const proxyServer = createProxyMiddleware(options);

app.use(bodyParser.xml({
    limit: process.env.PAYLOAD_LIMIT, // Reject payload bigger than 1 MB
    xmlParseOptions: {
      normalize: true, // Trim whitespace inside text nodes
      normalizeTags: false, // Transform tags to lowercase
      explicitArray: false, // Only put nodes in array if >1
      type : ['text/xml;charset=UTF-8','/xml','+xml']
    }}));
app.use('/',proxyServer);
app.listen(3000);