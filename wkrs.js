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

var handle_query = function() {
    if (window.location.search.match(/(\?|&)withings=\d+/)) {
        var l_dbg = d3.select('#list');
        try {
            var userid = window.location.search.match(/(\?|&)withings=\d+/)[0].split('=')[1];
            var url = '/withings/csv/'+userid
        } catch(e) {
            l_dbg.append('li').text('handle_query err: '+e);
            return;
        }
        l_dbg.append('li').text('Fetching csv: '+url);
        d3.csv(url, type, function(error, data) {
            if (error) throw error;
            process_csv_array(data);
        });
    }
};
handle_query()

// *********

var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.8;
var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.8;

var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

var formatDate = d3.time.format("%Y-%m-%d %I:%M %p");

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color_v = d3.scale.linear()
    .range([0.5, 1]);
var color_h = d3.scale.linear()
    .range([0, 360]);

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

var path = svg.append("path")
    .datum([])
    .attr("class", "line")
    .attr("d", line);
var dot = svg.append("circle")
    .attr("r", "10")
    .attr("cx", 30)
    .attr("cy", 30)
    .style("stroke", "black")
    .style("stroke-width", 3)
    .style("fill", "green");
var pathlines = [];
var pathlines_to_close = [];
var pathlines_closing = false;

var step_axis = d3.svg.axis().orient("top").ticks(4);
var slider_step = d3.select("#slider_step").call(d3.slider().value(100).min(1).max(500).step(1).axis(step_axis).on("slide", function(e, v) {
    d3.select(".slider_step_value").text(v);
}));
var slider_length = d3.select("#slider_length").call(d3.slider().value(7).min(1).max(7).step(1).axis(true).on("slide", function(e, v) {
    d3.select(".slider_length_value").text(v);
}));

var render = function(data) {
    /*
    var last_transition = path.transition()
      .delay(10)
      .duration(160)
      .ease("linear");
    */
    var last_transition = dot.transition();
    var p_transition;

    var first_idx = 0;
    var previous_idx = first_idx;
    var render_tick = function() {
        // render7
        var length = +d3.select(".slider_length_value").text();
        var max_previous_day = d3.time.day.offset(data[first_idx].date, length*-1);
        var make_transition = function(current_idx) {
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
        var make_transition_line = function(current_idx) {
            if (current_idx < 1) return last_transition; // no previous point
            current_data = data.filter(function(d, idx) {
              if (idx > current_idx) return false;
              return (current_idx - idx) <= 1;
            });
            time_delta = data[current_idx].date.getTime() - data[current_idx-1].date.getTime();
            var t_duration = transition_duration(time_delta);
            var color = d3.hsl(color_h(current_idx), 0.51, color_v(current_idx));
            var pathline =  svg.append("path")
                .datum([])
                .attr("class", "pathline")
                .attr("d", line([current_data[0], current_data[0]]));
            p_transition = pathline.transition()
                .duration(t_duration)
                .attr('d', line(current_data))
                .style('stroke', color.toString());
            pathlines.push([data[current_idx].date, pathline, line([current_data[1], current_data[1]]), time_delta]);
            while (pathlines.length && pathlines[0][0].getTime() < max_previous_day.getTime())
                pathlines_to_close.push(pathlines.shift());
            last_transition = last_transition.transition()
                .duration(t_duration/2)
                .style("opacity", 0.2)
                .transition()
                .style("opacity", 1);
            return p_transition;
        };
        /*
        while ((first_idx - previous_idx > 3) && (previous_idx < first_idx) && (data[previous_idx].date.getTime() < max_previous_day.getTime())) {
            // catch up with head
            previous_idx++;
            last_transition = make_transition(first_idx);
        };
        last_transition = make_transition(first_idx);
        */
        make_transition_line(first_idx);
        // eo render7

        first_idx++
        if (first_idx < data.length) last_transition.each("end", function() {
            d3.select('#list').append('li').text("last transition ends <" + previous_idx + "," + first_idx + ">");
            render_tick();
            close_pathline();
        });
    };

    var transition_duration = function(time_delta) {
        var duration = +d3.select(".slider_step_value").text();
        return (time_delta*0.0023) * duration / 3600
    };

    var close_pathline = function() {
        if (pathlines_closing) return;
        pathlines_closing = true;
        var elem = pathlines_to_close.shift();
        if (elem === undefined) {
            pathlines_closing = false;
            return; // empty
        }
        try {
            elem[1].transition()
                .duration(transition_duration(elem[3])/4)
                .attr("d", elem[2])
                .each("end", function() {
                    d3.select(this).remove();
                    pathlines_closing = false;
                    close_pathline();
                });
        } catch(e) {
            console.error("error in transition close: %o", e);
            pathlines_closing = false;
        }
    }
    render_tick();
};

var process_csv_array = function(data) {
  x.domain(d3.extent(data, function(d) { return d.weight; }));
  y.domain(d3.extent(data, function(d) { return d.fat; }));
  color_v.domain([0, data.length]);
  color_h.domain(color_v.domain());

  var bars_cnt = 5;
  var bars_data = d3.range(bars_cnt).map(function(i) {
      var val_x = i * (x.domain()[1] - x.domain()[0])/bars_cnt + x.domain()[0];
      var val_y = i * (y.domain()[1] - y.domain()[0])/bars_cnt + y.domain()[0];
      val_y = y.domain()[1];
      var color = i%2 ? "papayawhip" : "mediumvioletred";
      return [val_x, val_y, color]
  });
  var bars = svg.selectAll(".bar").data(bars_data).enter()
      .append("g")
      .attr("transform", "skewX(-45)")
      .attr("class", "bar");
  bars.append("rect")
      .attr("x", function(d) { return x(d[0]); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("width", w/bars_cnt)
      .attr("height", h)
      .attr("fill-opacity", 3e-2)
      .attr("fill", function(d) {return d[2]; });

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

  data.sort(function(a, b) { return a.date.getTime()-b.date.getTime(); });
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

