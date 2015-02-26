/* global process,console,require,module */
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
	slug: String,
	description: String,
	setup: String,
	teardown: String,
	tests: [{ title: String, code: String }],
	// hz - number of executions per second
	results: [{ hz: Number }]
});

function convertToSlug(text)
{
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'-')
        ;
}

perfTestSchema.pre('save', function(next) {
	this.slug = convertToSlug(this.title);
	next();
});

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
});

// initialize from an object
var secondTest = new PerfTest(data);

function findOrCreatePerfTest(title) {
	return PerfTest.findOne({ title: title }).exec(function(err, test) {
		if (test) console.log('found existing test');
		if (err) console.log('found error', err);

		// if found - update
		if (!test) {
			test = new PerfTest();
			test.title = 'New title';
		}

		test.author = 'Eugene';
		test.save(function(err) {
			if (err) console.error(err); else console.log('update successfull');	
		});

		return test;
	});
}

function updateOrCreateTest() {
	
	findOrCreatePerfTest('Image rotation')
	.then(function(blah) {
		console.log('outputing existing test', blah);	
	});
}

//updateOrCreateTest();

function connected(callback) {
	console.log('Connected to Mongo');
	// secondTest.save(function (err) {
	// 	if (err) console.error(err); else console.log('saved');
	// })
}

module.exports = PerfTest;