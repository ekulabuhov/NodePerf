'use strict';

var Benchmark = require('benchmark');
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var WebSocketServer = require("ws").Server;
var PerfTest = require('./server/mongoose');

function runTest(data, res) {
    // Save test to DB
    var perfTest = new PerfTest(data);

    var pairNumber = 1;

    do {
        perfTest.tests.push({
            title: data['test' + pairNumber + 'name'], 
            code: data['fn' + pairNumber]
        });
    } while (data['fn' + ++pairNumber]);

    perfTest.save(function (err) {
      if (err) console.error(err); else console.log('saved');
    })

    // Run test suite
    var suite = new Benchmark.Suite;
    
    Benchmark.prototype.setup = data.setup;
    //Benchmark.prototype.teardown = data.teardown;
    
    res.send('running test');

    perfTest.tests.forEach(function(test) {
        var fn = Function(test.code);
        // add tests
        suite.add(test.title, fn);
    })

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

// __dirname = /NodePerf/server
app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({
    extended: false
}));

app.post('/', function (req, res) {
    var fn = Function(req.body.fn);
    runTest(fn, res);
});

app.get('/api/perftest/:slug', function (req, res) {
    PerfTest.find({slug: req.params.slug}, function(err, result) {
        res.json(result);
    });
});

app.get('*', function(req,res) {
    res.sendFile(__dirname + '/client/index.html');
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