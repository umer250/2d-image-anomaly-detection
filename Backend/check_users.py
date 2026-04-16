import psycopg2

conn = psycopg2.connect('postgresql://postgres:12345@localhost:5432/anomaly_detection')
cur = conn.cursor()
cur.execute("SELECT id, email, role, is_active, hashed_password FROM users ORDER BY id;")
rows = cur.fetchall()
print(f"Total users: {len(rows)}")
print("-" * 80)
for r in rows:
    print(f"ID={r[0]}  email={r[1]}  role={r[2]}  active={r[3]}  hash_prefix={r[4][:20] if r[4] else 'NULL'}...")
cur.close()
conn.close()
