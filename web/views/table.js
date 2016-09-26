var users = {};
var x = d3.scaleTime();
var y = d3.scaleLinear();
var xAxis = d3.axisBottom()
    .scale(x)
var yAxis = d3.axisLeft()
    .scale(y)


var svg = d3.select('#tableChart');
var line_func = d3.line().x(function(d) { return x(d.date); }).y(function(d) { return y(d.v); });
var draw_line = function(chart_data, color) {
    svg.append('path')
        .attr('d', line_func(chart_data))
        .attr('stroke', color)
        .attr('stroke-width', '2')
        .attr('fill', 'none');
};


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

for (wuserid in users) {
    x
        .range([0,1000])
        .domain(d3.extent(users[wuserid]['classic'], function(d) { return d.date; }));
    y
        .range([0,500])
        .domain(d3.extent(users[wuserid]['classic'], function(d) { return d.v; }));
    break;
}


for (wuserid in users) {
    draw_line(users[wuserid]['classic'], 'blue');
    draw_line(users[wuserid]['twentyfour'], 'green');
}
