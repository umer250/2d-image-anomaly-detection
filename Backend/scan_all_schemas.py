import psycopg2
from psycopg2 import OperationalError

def scan_all_schemas():
    conn_str = "dbname='anomaly_detection' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT schemaname, tablename 
            FROM pg_tables 
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
        """)
        tables = cursor.fetchall()
        print("All tables in 'anomaly_detection' (all schemas):")
        for s, t in tables:
            print(f"  - {s}.{t}")
        conn.close()
    except OperationalError as e:
        print(f"Failed to connect: {e}")

scan_all_schemas()
