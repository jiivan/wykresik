CREATE TABLE withings_credentials (
    token text,
    secret text,
    wuserid text,
    created_at timestamp with time zone default now()
);

CREATE TABLE withings_measures (
    grpid int,
    wuserid int,
    weight numeric(6,3),
    height numeric(6,3),
    fat_free_mass numeric(6,3),
    fat_ratio numeric(6,3),
    fat_mass_weight numeric(6,3),
    diastolic_blood_pressure numeric(6,3),
    systolic_blood_pressure numeric(6,3),
    heart_pulse numeric(6,3),
    wdate timestamp,
    created_at timestamp with time zone default now()
);
