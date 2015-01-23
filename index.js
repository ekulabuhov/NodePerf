'use strict';

var Benchmark = require('benchmark');
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var WebSocketServer = require("ws").Server;

function runTest(data, res) {
    var suite = new Benchmark.Suite;
    
    Benchmark.prototype.setup = data.setup;
    //Benchmark.prototype.teardown = data.teardown;
    
    var pairNumber = 1;
    res.send('running test');

    do {
        var fn = Function(data['fn' + pairNumber]);
        // add tests
        suite.add(data['test' + pairNumber + 'name'], fn);
    } while (data['fn' + ++pairNumber]);

    // add listeners
    suite.on('cycle', function (event) {
        res.send(String(event.target));
    })
    .on('complete', function () {
        res.send('Fastest is ' + this.filter('fastest').pluck('name'));
    })
    .on('error', function () {
        res.send(JSON.stringify(arguments));
        console.log(arguments);
    })
    // run async
    .run({
        'async': true
    });
}

var port = process.env.PORT || 3000;

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({
    extended: false
}));

app.post('/', function (req, res) {
    var fn = Function(req.body.fn);
    runTest(fn, res);


    // ...
});


/* --== Web Socket server ==-- */
var wss = new WebSocketServer({
    server: server
})
console.log("websocket server created")

wss.on("connection", function (ws) {
    var id = setInterval(function () {
        ws.send(JSON.stringify('[PING] ' + new Date()), function () {})
    }, 5000)

    console.log("websocket connection open")

    ws.on("close", function () {
        console.log("websocket connection close")
        clearInterval(id)
    })

    ws.onmessage = function (event) {
        console.log(event.data)


        runTest(JSON.parse(event.data), ws);
    }
})