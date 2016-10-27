<div class="control-box date-range-prefix">{{ prefix }}</div>
<form class="date-range">
    <input class="datefrom" type="text" value="{{ first_date.strftime('%Y-%m-%d') if first_date else '' }}" />
    <input class="dateto" type="text" value="{{ last_date.strftime('%Y-%m-%d') if last_date else '' }}" />
    <button type="submit">Redraw</button>
</form>
