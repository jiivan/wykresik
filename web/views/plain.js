var x = d3.scaleTime();
var y_weight = d3.scaleLinear();
var y_fat = d3.scaleLinear();
var wuserid = d3.select('.control-box.wuserid').text();
var url = '/withings/csv/'+wuserid;
console.log('Fetching %o', url);
d3.csv(url, type, function(error, data) {
        if (error) throw error;
        //processs
        console.log('first row %o', data[0]);
        render_chart(data);
});


var last_fat = 0;
var last_weight = 0;

function type(d) {
  d.date = d3.timeParse("%Y-%m-%d %I:%M %p")(d.Date);
  d.weight = +d['Weight (kg)'];
  if (d.weight <= 0) d.weight = last_weight;
  d.fat = +d['Fat mass (%)'];
  if (d.fat <= 0) d.fat = last_fat;

  last_fat = d.fat;
  last_weight = d.weight;

  return d;
}

// svg rendering
var svg = d3.select('#tableChart');
var width = 1000;
var height = 500;
var margin_left = 40;
var margin_right = 40;
var margin_bottom = 70;

var draw_line = function(chart_data, line_func, color) {
    svg.append('path')
        .attr('d', line_func(chart_data))
        .attr('stroke', color)
        .attr('stroke-width', '2')
        .attr('fill', 'none')
        .on('mouseover', function() {
            d3.select(this).attr('stroke-width', '3').attr('stroke', d3.color(color).brighter(3));
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke-width', '2').attr('stroke', color);
        });
};

var draw_grid = function(selection, orientation) {
    selection.selectAll("g.tick").select(function() {
        var dthis = d3.select(this);
        if (orientation == "horizontal") {
            svg.insert('line', ':first-child')
                .attr('stroke', 'lightgrey')
                .attr('x1', 0)
                .attr('y1', height-margin_bottom)
                .attr('x2', 0)
                .attr('y2', 0)
                .attr('opacity', 0.4)
                .attr('transform', dthis.attr('transform'));
        } else if (orientation == "vertical") {
            var stroke_width = 1
            var label = parseFloat(dthis.select('text').text());
            if (label == Math.round(label)) stroke_width = 2;
            svg.insert('line', ':first-child')
                .attr('stroke', 'lightgrey')
                .attr('stroke-width', stroke_width)
                .attr('x1', margin_left)
                .attr('y1', 0)
                .attr('x2', width)
                .attr('y2', 0)
                .attr('opacity', 0.4)
                .attr('transform', dthis.attr('transform'));
        }
    });
};



var render_chart = function(chart_data) {
    x
        .range([margin_left,width-margin_right])
        .domain(d3.extent(chart_data, function(d) { return d.date }));
    y_weight
        .range([height-margin_bottom,1])
        .domain(d3.extent(chart_data, function(d) { return d.weight }));
    y_fat
        .range([height-margin_bottom,1])
        .domain(d3.extent(chart_data, function(d) { return d.fat }));

    var line_func = d3.line().x(function(d) { return x(d.date); });
    draw_line(chart_data, line_func.y(function(d) { return y_weight(d.weight); }), 'blue');
    draw_line(chart_data, line_func.y(function(d) { return y_fat(d.fat); }), 'green');

    var xAxis = d3.axisBottom(x).ticks(d3.timeMonday.every(1)).tickFormat(d3.timeFormat("%Y.%m.%d"));
    var yticks = function(linef) { return Math.round(linef.domain()[1] - linef.domain()[0])*2 }; // ticki co 0.5
    var yAxis_weight = d3.axisLeft(y_weight).ticks(yticks(y_weight));
    var yAxis_fat = d3.axisRight(y_fat).ticks(yticks(y_fat));


    svg.append('g').attr('transform', 'translate(0, '+(height-margin_bottom)+')').call(xAxis).call(draw_grid, "horizontal").call(function(selection) { selection.selectAll("g.tick text").attr('transform', 'rotate(90) translate(35, -14)'); });
    svg.append('g').attr('transform', 'translate('+margin_left+', 0)').call(yAxis_weight).call(draw_grid, "vertical").call(function(selection) {
        // ucinanie ostatniej (pierwszej bo oś Y jest do góry nogami)
        // kreseczki z path.
        var path = selection.select('path');
        var old_d = path.attr('d');
        path.attr('d', old_d.slice(0, old_d.length-3));
    });
    svg.append('g').attr('transform', 'translate('+(width-margin_right)+')').call(yAxis_fat);

};
