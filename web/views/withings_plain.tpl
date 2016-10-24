<html>
<head>
    <meta charset="utf-8"/>
    <link href="../wkrs.css" rel="stylesheet" media="screen"/>
</head>
<body>
    <div class="control-box wuserid">{{ selected_wuserid }}</div>
    % if len(wuserids) > 1:
        % for wid in wuserids:
            <span>user: {{ wid }}</span>
        % end
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
