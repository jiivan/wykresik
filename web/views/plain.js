var x = d3.scaleTime();
var y = d3.scaleLinear();
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

var render_chart = function(chart_data) {
    x
        .range([margin_left,width])
        .domain(d3.extent(chart_data, function(d) { return d.date }));
    y
        .range([height-margin_bottom,1])
        .domain([0, 100]);

    var line_func = d3.line().x(function(d) { return x(d.date); });
    draw_line(chart_data, line_func.y(function(d) { return y(d.weight); }), 'blue');
    draw_line(chart_data, line_func.y(function(d) { return y(d.fat); }), 'green');

    var xAxis = d3.axisBottom(x).ticks(d3.timeMonday.every(1)).tickFormat(d3.timeFormat("%Y.%m.%d"));
    yticks = Math.round(y.domain()[1] - y.domain()[0])*2 // ticki co 0.5
    var yAxis = d3.axisLeft(y).ticks(yticks);


    svg.append('g').attr('transform', 'translate(0, '+(height-margin_bottom)+')').call(xAxis).call(draw_grid, "horizontal").call(function(selection) { selection.selectAll("g.tick text").attr('transform', 'rotate(90) translate(35, -14)'); });
    svg.append('g').attr('transform', 'translate('+margin_left+', 0)').call(yAxis).call(draw_grid, "vertical").call(function(selection) {
        // ucinanie ostatniej (pierwszej bo oś Y jest do góry nogami)
        // kreseczki z path.
        var path = selection.select('path');
        var old_d = path.attr('d');
        path.attr('d', old_d.slice(0, old_d.length-3));
    });

};
