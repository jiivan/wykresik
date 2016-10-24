from bottle import default_app
from bottle import redirect
from bottle import request
from bottle import response
from bottle import route
from bottle import run
from bottle import view
import csv
import datetime
import importlib
import itertools
import os
import psycopg2
import psycopg2.extras
import random
import requests_oauthlib.oauth1_session
import sys
from withings import WithingsAuth, WithingsApi

import time


settings_name = os.environ.get('WYKRESIK_SETTINGS', 'settings')
settings = importlib.import_module(settings_name)

class InvalidToken(Exception): pass

def db_connection():
    return psycopg2.connect(settings.DATABASE, cursor_factory=psycopg2.extras.DictCursor)


def get_authorizer(token=None):
    back_url = '%s://%s/withings/comeback' % (
        request.get_header('url_scheme', 'http'),
        request.get_header('HTTP_HOST', request.get_header('SERVER_NAME', 'wykresik.genoomy.com')),
    )
    sys.stderr.write('back_url: %s\n' % (back_url,))
    auth = WithingsAuth(settings.WITHINGS['key'], settings.WITHINGS['secret'], back_url)
    if token:
        with db_connection() as db_conn:
            with db_conn.cursor() as c:
                c.execute('SELECT * FROM withings_credentials WHERE token=%s ORDER BY created_at DESC', (token,))
                db_result = c.fetchone()
        if db_result is None:
            raise InvalidToken
        secret = db_result['secret']
        auth.oauth_token = token
        auth.oauth_secret = secret
    return auth


def store_measures(creds):
    client = WithingsApi(creds)
    # lastupdate = int(time.time())
    measures = client.get_measures()
    with db_connection() as db_conn:
        for m in measures:
            with db_conn.cursor() as c:
                c.execute('SELECT 1 FROM withings_measures WHERE grpid = %s', (m.grpid,))
                if c.fetchone():
                    continue
                # grpid, wuserid, weight, height, fat_free_mass, fat_ratio, fat_mass_weight, diastolic_blood_pressure, systolic_blood_pressure, heart_pulse, created_at
                c.execute('INSERT INTO withings_measures (grpid, wuserid, weight, height, fat_free_mass, fat_ratio, fat_mass_weight, diastolic_blood_pressure, systolic_blood_pressure, heart_pulse, wdate) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', (m.grpid, creds.user_id, m.weight, m.height, m.fat_free_mass, m.fat_ratio, m.fat_mass_weight, m.diastolic_blood_pressure, m.systolic_blood_pressure, m.heart_pulse, m.date))


@route('/withings/authorize')
def withings_authorize():
    auth = get_authorizer()
    url = auth.get_authorize_url()
    with db_connection() as db_conn:
        with db_conn.cursor() as c:
            c.execute('INSERT INTO withings_credentials (token, secret) VALUES (%s, %s)', (auth.oauth_token, auth.oauth_secret))
    redirect(url)


@route('/withings/comeback')
def withings_comeback():
    oauth_token = request.GET.oauth_token
    oauth_verifier = request.GET.oauth_verifier

    try:
        creds = get_authorizer(oauth_token).get_credentials(oauth_verifier)
    except InvalidToken:
        sys.stderr.write('Invalid token %s\n' % (oauth_token,))
        redirect('/withings/authorize')
    except requests_oauthlib.oauth1_session.TokenMissing as e:
        sys.stderr.write('Token missing %s (%s)\n' % (oauth_token, e))
        redirect('/withings/authorize')
    with db_connection() as db_conn:
        with db_conn.cursor() as c:
            c.execute('UPDATE withings_credentials SET wuserid=%s WHERE token=%s', (creds.user_id, oauth_token))
    store_measures(creds)
    redirect('/?withings=%d' % (int(creds.user_id),))

@route('/withings/csv/<userid>')
def withings_csv(userid):
    import io
    csvfile = io.StringIO()
    writer = csv.writer(csvfile)
    writer.writerow(["Date","Weight (kg)","Fat mass (%)","Lean mass (%)","Comments"])
    def _r(v):
        import decimal
        if not isinstance(v, decimal.Decimal):
            return v
        return '%.2f' % v
    with db_connection() as db_conn:
        with db_conn.cursor() as c:
            c.execute('SELECT * FROM withings_measures WHERE wuserid=%s AND weight is not null AND fat_ratio is not null ORDER by wdate', (userid,))
            for db_row in c.fetchall():
                writer.writerow([
                    db_row['wdate'].strftime('%Y-%m-%d %I:%M %p'),
                    _r(db_row['weight']),
                    _r(db_row['fat_ratio']),
                    _r(100.0 - float(db_row['fat_ratio'] or 0)),
                    ''
                ])
    csvfile.seek(0)
    response.content_type = 'text/plain'
    return csvfile.read()


@route('/withings/table')
@route('/withings/table/<first_date:re:\d{4}\d{2}\d{2}>-<last_date:re:\d{4}\d{2}\d{2}>')
@view('withings_table')
def withings_table(first_date=None, last_date=None):
    if first_date:
        first_date = datetime.datetime.strptime(first_date, '%Y%m%d')
    if last_date:
        last_date = datetime.datetime.strptime(last_date, '%Y%m%d')
    db_operations_start = time.time()
    with db_connection() as db_conn:
        with db_conn.cursor() as c:
            c.execute('SELECT * FROM withings_maxminfive ORDER BY justday DESC, wuserid;')
            maxminfive = c.fetchall()
        with db_conn.cursor() as c:
            c.execute('SELECT * FROM withings_maxminfive_tf ORDER BY justday DESC, wuserid;')
            maxminfive_24h = c.fetchall()
    userdates = frozenset((r['wuserid'], r['justday'].replace(tzinfo=None)) for r in itertools.chain(maxminfive, maxminfive_24h))
    try:
        if not first_date:
            first_date = min(maxminfive[-1]['justday'].replace(tzinfo=None), maxminfive_24h[-1]['justday'].replace(tzinfo=None))
        if not last_date:
            last_date = max(maxminfive[0]['justday'].replace(tzinfo=None), maxminfive_24h[0]['justday'].replace(tzinfo=None))
    except IndexError: # empty sequence
        last_date = first_date = datetime.datetime.now()

    def _fillnulls(data):
        sdates = list(sorted(userdates, key=lambda r: (r[1], r[0]*-1)))
        while sdates and (sdates[-1][1] > last_date):
            sdates.pop()
        if not sdates:
            return data
        result = []
        wuserid, justday = sdates.pop()
        for row in data:
            if not (first_date <= row['justday'].replace(tzinfo=None) <= last_date):
                continue
            while (justday, wuserid*-1) > (row['justday'].replace(tzinfo=None), row['wuserid']*-1):
                result.append({'wuserid': wuserid, 'justday': justday, 'maxminfive': None})
                if not sdates:
                    break
                wuserid, justday = sdates.pop()
            if sdates:
                if (wuserid, justday) == (row['wuserid'], row['justday'].replace(tzinfo=None)):
                    wuserid, justday = sdates.pop()
            result.append(row)
        return result


    maxminfive = _fillnulls(maxminfive)
    maxminfive_24h = _fillnulls(maxminfive_24h)

    db_operations_delta = time.time() - db_operations_start
    return {
        'maxminfive': maxminfive,
        'maxminfive_24h': maxminfive_24h,
        'db_delta': db_operations_delta,
        'first_date': first_date,
        'last_date': last_date,
    }


@route('/withings/plain')
@view('withings_plain')
def withings_plain(wuserid=None):

    # Determin wuserid
    with db_connection() as db_conn:
        with db_conn.cursor() as c:
            c.execute('SELECT wuserid FROM withings_measures GROUP BY wuserid')
            wuserids = [r[0] for r in c.fetchall()]
    if not wuserids:
        redirect('/withings/authorize')
    if wuserid is None:
        wuserid = random.choice(wuserids)

    return {
        'wuserids': wuserids,
        'selected_wuserid': wuserid,
    }


if __name__ == '__main__':
    run(host='localhost', port=8080, debug=True)
else:
    default_app.default.config['catchall'] = False
    application = default_app()
