<div style="float: left;">
    <h1>{{ title }}</h1>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>userid</th>
                <th>max(min(fat_ratio))</th>
            </tr>
        </thead>
        % for row in data:
            <tr>
                <td>{{ row['justday'].date() }}</td>
                <td>{{ row['wuserid'] }}</td>
                <td>{{ row['maxminfive'] or 'null'}}</td>
            </tr>
        % end
    </table>
</div>
