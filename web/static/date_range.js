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
    var datefrom = $('.datefrom', this).val();
    var dateto = $('.dateto', this).val();
    var prefix = $('.control-box.date-range-prefix').text();
    if (! (datefrom && dateto) ) return false
    var url = prefix + '/' + datefrom.replace(/-/g, '') + '-' + dateto.replace(/-/g, '');
    console.log('submit %o', url);
    window.location.href = url;
    return false;
});
