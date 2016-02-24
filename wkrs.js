handle_file = function() {
    var input = d3.select(this).remove();
    var files = this.files; // FileList
    var l_dbg = d3.select('#list');
    for (var i=0, fmeta; fmeta=files[i]; i++) {
        l_dbg.append('li').text(fmeta.name + ' ' + fmeta.size + ' ' + fmeta.type);
        // fmeta.size; // bytes
        // fmeta.type; // mime
        if (!fmeta.type.match('text/.*')) { // probably text/csv would be enough
            continue;
        };
        var reader = new FileReader();
        reader.onload = function(e) {
            var csv_string = e.target.result;
            l_dbg.append('li').text('read '+ csv_string.length/1024.0 + 'kB');
            process_csv_array(d3.csv.parse(csv_string, type));
            l_dbg.append('li').text('parsed');
        };

        reader.readAsText(fmeta);
    };
};
d3.select('input[name=file]').on('change', handle_file);

// *********

var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

var formatDate = d3.time.format("%Y-%m-%d %I:%M %p");

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .x(function(d) { return x(d.weight); })
    .y(function(d) { return y(d.fat); });

var title = d3.select("body").append("h2")
    .text("Chart");

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var path = null;
var step_axis = d3.svg.axis().orient("top").ticks(4);
var slider_step = d3.select("#slider_step").call(d3.slider().value(100).min(1).max(200).step(1).axis(step_axis).on("slide", function(e, v) {
    d3.select(".slider_step_value").text(v);
}));
var slider_length = d3.select("#slider_length").call(d3.slider().value(7).min(1).max(7).step(1).axis(true).on("slide", function(e, v) {
    d3.select(".slider_length_value").text(v);
}));

var render_seven = function(data, last_transition, first_idx, previous_idx) {
  console.log('render_seven(%o, %o)', first_idx, previous_idx);
  var first_day = data[first_idx].date
  var duration = 360;
  var length = 7;
  var next_day = d3.time.day.offset(first_day, 1);
  var last_day = d3.time.day.offset(first_day, length);
  var previous_last_day = d3.time.day.offset(last_day, -1);
  var next_idx = null;
  var make_transition = function(current_idx) {
      if ((current_idx - previous_idx > 3) && previous_idx < first_idx) previous_idx ++;
      var current_data = data.map(function(d, idx) {
        if (idx < previous_idx) return data[previous_idx];
        if (idx > current_idx) return data[current_idx];
        return d;
      });
      last_transition = last_transition.transition()
          .duration(duration)
          .attr("d", line(current_data))
      return last_transition;
  };
  d3.range(first_idx, data.length).forEach(function(current_idx) {
      if (data[current_idx].date.getTime() > last_day.getTime()) return false;
      if (next_idx === null && data[current_idx].date.getTime() >= next_day.getTime()) next_idx = current_idx;
      if (first_idx > 0 && data[current_idx].date.getTime() < previous_last_day.getTime()) return true;
      last_transition = make_transition(current_idx);
  });
  return [last_transition, next_idx];
}
var render = function(data) {
  var last_transition = path.transition()
    .delay(10)
    .duration(160)
    .ease("linear");

  var first_idx = 0;
  var previous_idx = first_idx;
  var render_tick = function() {
      var result = render_seven(data, last_transition, first_idx, previous_idx);
      last_transition = result[0];
      previous_idx = first_idx;
      first_idx = result[1];
      if (first_idx === null) return;
      if (first_idx < data.length) last_transition.each("end", function() {
          d3.select('#list').append('li').text("last transition ends <" + previous_idx + "," + first_idx + ">");
          render_tick();
      });
  };
  render_tick();
};

d3.csv("Withings.csv", type, function(error, data) {
  if (error) throw error;

  return; //xxx

  process_csv_array(data);
});

var process_csv_array = function(data) {
  x.domain(d3.extent(data, function(d) { return d.weight; }));
  y.domain(d3.extent(data, function(d) { return d.fat; }));

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Fat (%)");

  path =
    svg.append("path")
        .datum([])
        .attr("class", "line")
        .attr("d", line);

  data.sort(function(d) { return d.date; });
  render(data);
};

var last_fat = 0;
var last_weight = 0;

function type(d) {
  d.date = formatDate.parse(d.Date);
  d.weight = +d['Weight (kg)'];
  if (d.weight <= 0) d.weight = last_weight;
  d.fat = +d['Fat mass (%)'];
  if (d.fat <= 0) d.fat = last_fat;

  last_fat = d.fat;
  last_weight = d.weight;

  return d;
}

