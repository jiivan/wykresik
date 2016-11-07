<html>
<head>
    <meta charset="utf-8"/>
    <link href="../wkrs.css" rel="stylesheet" media="screen"/>
    <link href="/s/pickadate/default.css" rel="stylesheet" media="screen"/>
    <link href="/s/pickadate/default.date.css" rel="stylesheet" media="screen"/>
    <style type="text/css">
        .control-box { display: none; }
        .axis-weight,
        .axis-weight path,
        .axis-weight .tick line,
        .axis-label.weight { stroke: blue; }
        .axis-fat,
        .axis-fat path,
        .axis-fat .tick line,
        .axis-label.fat { stroke: green; }
    </style>
</head>
<body>
    <div class="control-box wuserid">{{ selected_wuserid }}</div>
    % if first_date and last_date:
        <div class="control-box date-range">
            <span class="first">{{ first_date.strftime('%Y-%m-%d') }}</span>
            <span class="last">{{ last_date.strftime('%Y-%m-%d') }}</span>
        </div>
    % end
    % for wid in wuserids:
        <a href='/withings/plain-{{ wid }}'>user:
            % if wid == selected_wuserid:
             *
            % end
            {{ wid }}
        </a>
    % end

    % include('inc_date_range.tpl', prefix='/withings/plain-'+str(selected_wuserid))

    <div class="canvas-container">
        <svg id="tableChart" width="1000" height="500"></svg>
    </div>
    <script src="https://d3js.org/d3.v4.js"></script>
    <script type="text/javascript" src="/s/plain.js"></script>
    <script src="https://code.jquery.com/jquery-1.12.4.min.js" type="text/javascript"></script>
    <script src="/s/pickadate/picker.js" type="text/javascript"></script>
    <script src="/s/pickadate/picker.date.js" type="text/javascript"></script>
    <script src="/s/date_range.js" type="text/javascript"></script>
</body>
</html>
