import csv
from bottle import default_app
from bottle import redirect
from bottle import request
from bottle import response
from bottle import route
from bottle import run
from bottle import view
import psycopg2
import psycopg2.extras
from withings import WithingsAuth, WithingsApi

import settings
import time


def db_connection():
    return psycopg2.connect(settings.DATABASE, cursor_factory=psycopg2.extras.DictCursor)


def get_authorizer(token=None):
    auth = WithingsAuth(settings.WITHINGS['key'], settings.WITHINGS['secret'], 'http://wykresik.genoomy.com/withings/comeback')
    if token:
        with db_connection() as db_conn:
            with db_conn.cursor() as c:
                c.execute('SELECT * FROM withings_credentials WHERE token=%s ORDER BY created_at DESC', (token,))
                db_result = c.fetchone()
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

    creds = get_authorizer(oauth_token).get_credentials(oauth_verifier)
    with db_connection() as db_conn:
        with db_conn.cursor() as c:
            c.execute('UPDATE withings_credentials SET wuserid=%s WHERE token=%s', (creds.user_id, oauth_token))
    store_measures(creds)
    redirect('http://wykresik.genoomy.com/?withings=%d' % (int(creds.user_id),))

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
@view('withings_table')
def withings_table():
    db_operations_start = time.time()
    with db_connection() as db_conn:
        with db_conn.cursor() as c:
            c.execute('SELECT * FROM withings_maxminfive ORDER BY justday DESC, wuserid;')
            maxminfive = c.fetchall()
        with db_conn.cursor() as c:
            c.execute('SELECT * FROM withings_maxminfive_tf ORDER BY justday DESC, wuserid;')
            maxminfive_24h = c.fetchall()
    db_operations_delta = time.time() - db_operations_start
    return {
        'maxminfive': maxminfive,
        'maxminfive_24h': maxminfive_24h,
        'db_delta': db_operations_delta,
    }


if __name__ == '__main__':
    run(host='localhost', port=8080, debug=True)
else:
    application = default_app()
