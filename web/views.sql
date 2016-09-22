create view withings_minfat_day as select wuserid, date_trunc('day', wdate) as justday, min(fat_ratio) as minfat from withings_measures group by date_trunc('day', wdate), wuserid;

create view withings_maxminfive as select wuserid, justday, (select max(minfat) from withings_minfat_day as sub where sub.wuserid=top.wuserid and sub.justday <= top.justday and sub.justday > top.justday - interval '5 days') as maxminfive from withings_minfat_day top;

create view withings_minfat_twentyfour as select wuserid, extract(days from now()-wdate) as days_ago, min(fat_ratio) as minfat from withings_measures group by days_ago, wuserid;

create view withings_maxminfive_tf as select wuserid, date_trunc('day', now()) - (days_ago * interval '1 day') as justday, (select max(minfat) from withings_minfat_twentyfour as sub where sub.wuserid=top.wuserid and sub.days_ago <= top.days_ago and sub.days_ago > top.days_ago - 5) as maxminfive from withings_minfat_twentyfour top;
