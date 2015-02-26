/* global console,require,process */
'use strict';

var Benchmark = require('benchmark');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var WebSocketServer = require('ws').Server;
var PerfTest = require('./server/mongoose');
var extend = require('util')._extend;

/* 
* @param (data) Posted form data
* @return Promise 
*/
function findOrCreatePerfTest(data) {
    return PerfTest.findOne({ title: data.title }).exec(function(err, test) {
        if (err) console.log(err);
        
        // if not found - create
        if (!test) {
            var pairNumber = 1;

            test = new PerfTest(data);
            do {
                test.tests.push({
                    title: data['test' + pairNumber + 'name'], 
                    code: data['fn' + pairNumber]
                });
            } while (data['fn' + ++pairNumber]);
        } else {
            // if it is found - update the object
            extend(test, data);
        }

        return test;
    });
}

function runTest(perfTest, res) {
    // Run test suite
    var suite = new Benchmark.Suite();
    
    Benchmark.prototype.setup = perfTest.setup;
    //Benchmark.prototype.teardown = perfTest.teardown;
    console.log(perfTest.setup);
    perfTest.save(function(err) {
            if (err) console.error(err); else console.log('update successfull');    
        });
    
    res.send('running test');

    perfTest.tests.forEach(function(test) {
        var fn = Function(test.code);
        // add tests
        suite.add(test.title, fn);
    });

    // add listeners
    suite.on('cycle', function (event) {
        res.send(String(event.target));

        perfTest.results.push({ hz:event.target.hz });
    })
    .on('complete', function () {
        res.send('Fastest is ' + this.filter('fastest').pluck('name'));

        perfTest.save(function (err) {
          if (err) console.error(err); else console.log('saved');
        });
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
});

console.log('websocket server created');

wss.on("connection", function (ws) {
    var id = setInterval(function () {
        ws.send(JSON.stringify('[PING] ' + new Date()), function () {})
    }, 5000);

    console.log('websocket connection open');

    ws.on('close', function () {
        console.log('websocket connection close');
        clearInterval(id);
    });

    ws.onmessage = function (event) {
        console.log(event.data);

        var formData = JSON.parse(event.data);
        findOrCreatePerfTest(formData)
        .then(function(perfTest) { 
            runTest(perfTest, ws); 
        });
    };
});