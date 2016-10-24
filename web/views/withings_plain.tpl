<html>
<head>
    <meta charset="utf-8"/>
    <link href="../wkrs.css" rel="stylesheet" media="screen"/>
    <style type="text/css">
        .control-box { display: none; }
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
    <div class="canvas-container">
        <svg id="tableChart" width="1000" height="500"></svg>
    </div>
    <script src="https://d3js.org/d3.v4.js"></script>
    <script type="text/javascript">
        % include('plain.js')
    </script>
</body>
</html>
