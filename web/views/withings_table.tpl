<html>
<head>
    <meta charset="utf-8"/>
    <link href="../wkrs.css" rel="stylesheet" media="screen"/>
    <style type="text/css">
        tr:nth-child(even) {background-color: #f2f2f2}
        th {
            background-color: #4CAF50;
            color: white;
        }
    </style>
</head>
<body>
    % for wid in wuserids:
        <a href='/withings/table-{{ wid }}'>user:
            % if wid == selected_wuserid:
             *
            % end
            {{ wid }}
        </a>
    % end
    <div>
        <svg id="tableChart" width="1000" height="500"></svg>
    </div>
    % include('inc_table.tpl', title='5 days', data=maxminfive)
    % include('inc_table.tpl', title='5 24h periods', data=maxminfive_24h)
    <div>&nbsp;</div>
    <span>generated in: {{ '%.3f' % db_delta }}sec.</span>
    <div style="display: none;" class="chart-data" data-first-date="{{ first_date.strftime('%Y-%m-%d') }}" data-last-date="{{ last_date.strftime('%Y-%m-%d') }}">
        <div class="classic">
            % for row in maxminfive:
                % if row['maxminfive']:
                    <span data-wdate="{{ row['justday'].strftime('%Y-%m-%d') }}" data-wuserid="{{ row['wuserid'] }}">{{ row['maxminfive'] }}</span>
                % end
            % end
        </div>
        <div class="twentyfour">
            % for row in maxminfive_24h:
                % if row['maxminfive']:
                    <span data-wdate="{{ row['justday'].strftime('%Y-%m-%d') }}" data-wuserid="{{ row['wuserid'] }}">{{ row['maxminfive'] }}</span>
                % end
            % end
        </div>
    </div>
    <script src="https://d3js.org/d3.v4.js"></script>
    <script type="text/javascript">
        % include('table.js')
    </script>
</body>
</html>
