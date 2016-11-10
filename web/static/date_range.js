// requires
/*
    <link href="/s/pickadate/default.css" rel="stylesheet" media="screen"/>
    <link href="/s/pickadate/default.date.css" rel="stylesheet" media="screen"/>
    <script src="https://code.jquery.com/jquery-1.12.4.min.js" type="text/javascript"></script>
    <script src="/s/pickadate/picker.js" type="text/javascript"></script>
    <script src="/s/pickadate/picker.date.js" type="text/javascript"></script>
    */
$('.datefrom').pickadate({
    format: 'yyyy-mm-dd',
});
$('.dateto').pickadate({
    format: 'yyyy-mm-dd',
});
$('form.date-range').submit(function() {
    var this_form = this;
    var datefrom = $('.datefrom', this_form).val();
    var dateto = $('.dateto', this_form).val();
    var _prep_numeric = function(selector) {
        return Math.round(parseFloat($(selector, this_form).val())*10);
    };
    var fat_min = _prep_numeric('.fat_min');
    var fat_max = _prep_numeric('.fat_max');
    var weight_min = _prep_numeric('.weight_min');
    var weight_max = _prep_numeric('.weight_max');
    var prefix = $('.control-box.date-range-prefix').text();
    if (! (datefrom && dateto) ) return false
    var url = prefix + '/' + datefrom.replace(/-/g, '') + '-' + dateto.replace(/-/g, '');
    url += '/fat-'+fat_min+'-'+fat_max+'/weight-'+weight_min+'-'+weight_max;
    console.log('submit %o', url);
    window.location.href = url;
    return false;
});
