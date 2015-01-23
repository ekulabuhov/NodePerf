window.onload = init;

_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

function init() {
    var testNum = 1;
    var host = location.origin.replace(/^http/, 'ws')
    var ws = new WebSocket(host);
    ws.onmessage = function (event) {
        if (event.data.indexOf('[PING]') > -1) {
            console.log('ping');
            return;
        }
        var li = document.createElement('li');
        li.innerHTML = event.data;
        document.querySelector('#pings').appendChild(li);
    };
    
    $("#submit").click(function () {
        var formData = _.object($("form").serializeArray().map(function(v) {return [v.name, v.value];} ))
        ws.send(JSON.stringify(formData));
    });
    
    function addCase(data) {
        var template = _.template(
            '<div>' +
                '<label>Title</label>' +
                '<input name="test{{ testNum }}name" type="text" value="{{ testName }}">' +
            '</div>' +
            '<div>' +
                '<label>Code</label>' +
                '<textarea name="fn{{ testNum }}" rows="11" cols="80">{{ testCode }}</textarea>' +
            '</div>');
        data.testNum = testNum++;
        if (!data.testName) { data.testName = 'Test case #' + data.testNum; }
        if (!data.testCode) { data.testCode = 'Code for test case #' + data.testNum; }
        $('form').append(template(data));
    }
    
    var firstTest = 
    'var bitmap = new Buffer(sourceBmp.data.length);\n' +
    'var offset = 0;\n' +
    'for (var x = 0; x < sourceBmp.width; x++) {\n' +
    '    for (var y = sourceBmp.height - 1; y >= 0;  y--) {\n' +
    '        var idx = (sourceBmp.width * y + x) << 2;\n' +
    '        var data = sourceBmp.data.readUInt32BE(idx, true);\n' +
    '        bitmap.writeUInt32BE(data, offset, true);\n' +
    '        offset += 4;\n' +
    '    }\n' +
    '}\n';
    
    var secondTest = 
    'var bitmap = [];\n' +
    'for (var x = 0; x < sourceBmp.width; x++) {\n' +
    '    for (var y = sourceBmp.height - 1; y >= 0;  y--) {\n' +
    '        var idx = (sourceBmp.width * y + x) << 2;\n' +
    '        bitmap.push(sourceBmp.data[idx]);\n' +
    '        bitmap.push(sourceBmp.data[idx+1]);\n' +
    '        bitmap.push(sourceBmp.data[idx+2]);\n' +
    '        bitmap.push(sourceBmp.data[idx+3]);     \n' +
    '    }\n' +
    '}\n' 

    // Add first case on init
    addCase({testName: "Write uint32", testCode: firstTest});
    addCase({testName: "Push", testCode: secondTest});
    
    $('#setup').text(
        'var sourceBmp = {};\n' +
        '// var a = []; for (i=0; i<16; i++) { a.push(i) }\n' +
        'sourceBmp.data = new Buffer(100*100*4);\n' +
        '\n' +
        'sourceBmp.width = 100;\n' +
        'sourceBmp.height = 100;' )
    
    
    $("#addCase").click(addCase);
}