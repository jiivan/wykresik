var users = {};
var x = d3.scaleTime();
var y = d3.scaleLinear();


var svg = d3.select('#tableChart');
var width = 1000;
var height = 500;
var margin_left = 40;
var margin_bottom = 20;
var line_func = d3.line().x(function(d) { return x(d.date); }).y(function(d) { return y(d.v); });
var draw_line = function(chart_data, color) {
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


var draw_grid = function() {
    var step = 20;
    for (var i=0; i<(height/step); i++) {
        svg.append('line')
            .attr('stroke', 'lightgrey')
            .attr('x1', 10)
            .attr('y1', 10)
            .attr('x2', width)
            .attr('y2', 10)
            .attr('transform', 'translate(0,'+step*i+')');
    }
    for (var i=0; i<(width/step); i++) {
        svg.append('line')
            .attr('stroke', 'lightgrey')
            .attr('x1', 10)
            .attr('y1', 10)
            .attr('x2', 10)
            .attr('y2', height)
            .attr('transform', 'translate('+step*i+', 0)');
    }
};

draw_grid();


var process_chart_data = function(selection, key) {
    selection.select(function() {
        var wdate = d3.timeParse("%Y-%m-%d")(this.getAttribute('data-wdate'));
        var wuserid = this.getAttribute('data-wuserid');
        var v = this.innerHTML;
        if (!users[wuserid]) {
            users[wuserid] = { classic: [], twentyfour: [] };
        }
        users[wuserid][key].push({date: wdate, v: v});
    });
}

process_chart_data(d3.selectAll('.chart-data .classic span'), 'classic');
process_chart_data(d3.selectAll('.chart-data .twentyfour span'), 'twentyfour');

var mdata = [];
for (wuserid in users) {
    var muser = d3.merge([users[wuserid]['classic'], users[wuserid]['twentyfour']]);
    mdata = d3.merge([mdata, muser]);
}
x
    .range([margin_left,width])
    .domain(d3.extent(mdata, function(d) { return d.date; }));
y
    .range([height-margin_bottom,margin_bottom])
    .domain(d3.extent(mdata, function(d) { return d.v; }));


for (wuserid in users) {
    draw_line(users[wuserid]['classic'], 'blue');
    draw_line(users[wuserid]['twentyfour'], 'green');
}

var xAxis = d3.axisBottom(x).ticks(d3.timeWeek.every(5));
var yAxis = d3.axisLeft(y).ticks(15);
svg.append('g').attr('transform', 'translate(0, '+(height-margin_bottom)+')').call(xAxis);
svg.append('g').attr('transform', 'translate('+margin_left+', 0)').call(yAxis);
