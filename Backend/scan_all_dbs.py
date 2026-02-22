import psycopg2
from psycopg2 import OperationalError

def scan_all_dbs():
    conn_str = "dbname='postgres' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        dbs = cursor.fetchall()
        
        for db_name_tuple in dbs:
            db_name = db_name_tuple[0]
            print(f"--- Database: {db_name} ---")
            try:
                db_conn = psycopg2.connect(f"dbname='{db_name}' user='postgres' password='12345' host='localhost' port='5432'")
                db_cursor = db_conn.cursor()
                db_cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public';
                """)
                tables = db_cursor.fetchall()
                for t in tables:
                    print(f"  - {t[0]}")
                db_conn.close()
            except Exception as e:
                print(f"  Error connecting to {db_name}: {e}")
        conn.close()
    except Exception as e:
        print(f"Failed to connect to postgres: {e}")

scan_all_dbs()
