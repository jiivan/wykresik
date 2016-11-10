<div class="control-box date-range-prefix">{{ prefix }}</div>
<form class="date-range">
    <fieldset>
        <legend>Date constraints</legend>
        <input class="datefrom" type="text" value="{{ first_date.strftime('%Y-%m-%d') if first_date else '' }}" />
        <input class="dateto" type="text" value="{{ last_date.strftime('%Y-%m-%d') if last_date else '' }}" />
    </fieldset>
    <fieldset>
        <legend>Fat constraints</legend>
        <input class="fat_min" type="number" value="{{ fat_min if fat_min else '' }}" />
        <input class="fat_max" type="number" value="{{ fat_max if fat_max else '' }}" />
    </fieldset>
    <fieldset>
        <legend>Weight constraints</legend>
        <input class="weight_min" type="number" value="{{ weight_min if weight_min else '' }}" />
        <input class="weight_max" type="number" value="{{ weight_max if weight_max else '' }}" />
    </fieldset>
    <button type="submit">Redraw</button>
</form>
