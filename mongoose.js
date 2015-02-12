if (!process.env.MONGOLAB_URI) { 
	console.error('Environment variable for MONGOLAB_URI is not set.');
	process.exit(1); 
}

var mongoose = require('mongoose');

mongoose.connect(process.env.MONGOLAB_URI);

var db = mongoose.connection;
db.once('open', connected);

var perfTestSchema = mongoose.Schema({
	author: String,
	title: String,
	description: String,
	setup: String,
	teardown: String,
	tests: [{ title: String, code: String }]
})

var PerfTest = mongoose.model('PerfTest', perfTestSchema);
var data = { author: 'Egene' };
var firstTest = new PerfTest({
	author: 'Eugene',
	title: 'Compare shit',
	setup: 'Setup code',
	tests: [{
		title: 'First test option',
		code: 'Code for first test'
	},
	{
		title: 'Second test option',
		code: 'Code for second test'
	}]
})

// initialize from an object
var secondTest = new PerfTest(data);

function connected(callback) {
	console.log('Connected to Mongo');
	// secondTest.save(function (err) {
	// 	if (err) console.error(err); else console.log('saved');
	// })
}

module.exports = PerfTest;