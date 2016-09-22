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
        % include('inc_table.tpl', title='5 days', data=maxminfive)
        % include('inc_table.tpl', title='5 24h periods', data=maxminfive_24h)
        <div>&nbsp;</div>
        <span>generated in: {{ '%.3f' % db_delta }}sec.</span>
    </body>
</html>
