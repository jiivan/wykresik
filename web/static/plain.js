var x = d3.scaleTime();
var y_weight = d3.scaleLinear();
var y_fat = d3.scaleLinear();
var wuserid = d3.select('.control-box.wuserid').text();
var url = '/withings/csv/'+wuserid;
console.log('Fetching %o', url);
d3.csv(url, type, function(error, data) {
        if (error) throw error;
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
var margin_left = 80;
var margin_right = 80;
var margin_bottom = 70;
var margin_top = 10;

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
                .attr('y1', height-margin_bottom-margin_top)
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
                .attr('x2', width-margin_right)
                .attr('y2', 0)
                .attr('opacity', 0.4)
                .attr('transform', dthis.attr('transform'));
        }
    });
};



var render_chart = function(chart_data) {
    //processs
    var first_date = d3.min(chart_data, function(d) { return d.date });
    var last_date = d3.max(chart_data, function(d) { return d.date });
    d3.select('.control-box.date-range').select(function() {
        if (!this) return;

        first_date = d3.timeParse('%Y-%m-%d')(d3.select(this).select('.first').text());
        last_date = d3.timeParse('%Y-%m-%d')(d3.select(this).select('.last').text());
        chart_data = chart_data.filter(function(d) { return (d.date >= first_date) && (d.date <= last_date); });
    });

    // determine fat limits
    var fat_min, fat_max;
    d3.select('.control-box.fat-limits').select(function() {
        if (!this) return;
        fat_min = parseFloat(d3.select(this).attr('data-min'));
        fat_max = parseFloat(d3.select(this).attr('data-max'));
    });
    // determine weight limits
    var weight_min, weight_max;
    d3.select('.control-box.weight-limits').select(function() {
        if (!this) return;
        weight_min = parseFloat(d3.select(this).attr('data-min'));
        weight_max = parseFloat(d3.select(this).attr('data-max'));
    });


    // synchronize domains etc.
    var _fc = function(a) { return [Math.floor(a[0]), Math.ceil(a[1])]; };
    var y_weight_domain = _fc(d3.extent(chart_data, function(d) { return d.weight }));
    if (! (weight_min === undefined)) y_weight_domain = _fc([weight_min, weight_max]);
    var y_fat_domain = _fc(d3.extent(chart_data, function(d) { return d.fat }));
    if (! (fat_min === undefined)) y_fat_domain = _fc([fat_min, fat_max]);
    var _diff = function(dm) { return Math.ceil(dm[1] - dm[0]); };
    var delta = _diff(y_weight_domain) - _diff(y_fat_domain);
    var _adjust_domain = function(d, delta) {
        return [d[0] - Math.floor(delta/2), d[1] + Math.ceil(delta/2)];
    };
    if (delta < 0) y_weight_domain = _adjust_domain(y_weight_domain, delta);
    else if (delta > 0) y_fat_domain = _adjust_domain(y_fat_domain, delta);

    // propagate domains to form
    $('form.date-range .fat_min').val(y_fat_domain[0]);
    $('form.date-range .fat_max').val(y_fat_domain[1]);
    $('form.date-range .weight_min').val(y_weight_domain[0]);
    $('form.date-range .weight_max').val(y_weight_domain[1]);
    $('form.date-range .datefrom').val(d3.timeFormat('%Y-%m-%d')(first_date));
    $('form.date-range .dateto').val(d3.timeFormat('%Y-%m-%d')(last_date));

    x
        .range([margin_left,width-margin_right])
        .domain([first_date, last_date]);
    y_weight
        .range([height-margin_bottom-margin_top,margin_top])
        .domain(y_weight_domain);
    y_fat
        .range([height-margin_bottom-margin_top,margin_top])
        .domain(y_fat_domain);

    var line_func = d3.line().x(function(d) { return x(d.date); });
    var weight_color = 'blue';
    var fat_color = 'green';
    draw_line(chart_data, line_func.y(function(d) { return y_weight(d.weight); }), weight_color);
    draw_line(chart_data, line_func.y(function(d) { return y_fat(d.fat); }), fat_color);

    var xAxis = d3.axisBottom(x).ticks(d3.timeMonday.every(1)).tickFormat(d3.timeFormat("%Y.%m.%d"));
    var yticks = function(linef) { return Math.round(linef.domain()[1] - linef.domain()[0])*2 }; // ticki co 0.5
    var yAxis_weight = d3.axisLeft(y_weight).ticks(yticks(y_weight));
    var yAxis_fat = d3.axisRight(y_fat).ticks(yticks(y_fat));


    svg.append('g').attr('transform', 'translate(0, '+(height-margin_bottom-margin_top)+')').call(xAxis).call(draw_grid, "horizontal").call(function(selection) { selection.selectAll("g.tick text").attr('transform', 'rotate(90) translate(35, -14)'); });
    svg.append('g').attr('class', 'axis-weight').attr('transform', 'translate('+margin_left+', 0)').call(yAxis_weight).call(draw_grid, "vertical").call(function(selection) {
        // ucinanie ostatniej (pierwszej bo oś Y jest do góry nogami)
        // kreseczki z path.
        var path = selection.select('path');
        var old_d = path.attr('d');
        path.attr('d', old_d.slice(0, old_d.length-3));
    });
    svg.append('g').attr('class', 'axis-fat').attr('transform', 'translate('+(width-margin_right)+')').call(yAxis_fat);

    // axis labels
    svg.append('text').attr('class', 'axis-label').attr('transform', 'translate(0, '+(height-margin_bottom/2)+')').text("Date");
    svg.append('text').attr('class', 'axis-label weight').attr('transform', 'translate('+(margin_left/3)+', 95),rotate(-90)').text("Weight (kg)");
    svg.append('text').attr('class', 'axis-label fat').attr('transform', 'translate('+(width-(margin_right/3))+', 60), rotate(-90)').text("Fat (%)");

};
