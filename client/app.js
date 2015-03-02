/* global _,$,console,page,google */
window.onload = init;

_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

var testNum = 1;

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

function init() {
    var host = location.origin.replace(/^http/, 'ws'),
        ws = new WebSocket(host);

    ws.onmessage = function (event) {
        if (event.data.indexOf('[PING]') > -1) {
            console.log('ping');
            return;
        }
        var li = document.createElement('li');
        li.innerHTML = event.data;
        document.querySelector('#pings').appendChild(li);
    };
    
    $('#submit').click(function () {
        var formData = _.object($('form').serializeArray()
            .map(function(v) { 
                return [v.name, v.value];
            } ));
        ws.send(JSON.stringify(formData));
    }); 

    function drawChart(chartData) {
      console.log(chartData);

      var data = new google.visualization.arrayToDataTable(chartData, true);

      var options = {
        enableInteractivity: false,
        tooltip: {trigger: 'none'},
        
        legend: { position: 'none' },
        chart: { title: 'Results'
               },
        bars: 'horizontal', // Required for Material Bar Charts.
        axes: {
          x: {
            0: { side: 'bottom', label: 'Ops/sec'} // Top x-axis.
          }
        },
      };

      var chart = new google.charts.Bar(document.getElementById('top_x_div'));
      chart.draw(data, options);
    }

    
    $('#addCase').click(addCase);

    // PageJs - setup client side routing
    page('/:slug', function(context){
      var slug = context.params.slug;
      console.log('Loading details for test', slug);
      $.getJSON('/api/perftest/' + slug, function(test) {
        var perfTest = test[0];
        console.log(perfTest);
        $('#setup').text(perfTest.setup);
        $('#author').val(perfTest.author);
        $('#title').val(perfTest.title);
        perfTest.tests.forEach(function(test) {
            addCase({testName: test.title, testCode: test.code});
        });

        var chartData = perfTest.results.map(function(result, index) {
          return [ perfTest.tests[index].title, result.hz ];
        });
        google.load('visualization', '1.1', {
          'callback' : function() { drawChart(chartData); },
          packages:['bar']
        });
      });
    });
    
    page();
    console.log('page routing enabled');
}