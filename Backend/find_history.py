import psycopg2
from psycopg2 import OperationalError

def find_history_table():
    conn_str = "dbname='postgres' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        dbs = cursor.fetchall()
        
        found = False
        for db_name_tuple in dbs:
            db_name = db_name_tuple[0]
            try:
                db_conn = psycopg2.connect(f"dbname='{db_name}' user='postgres' password='12345' host='localhost' port='5432'")
                db_cursor = db_conn.cursor()
                db_cursor.execute("""
                    SELECT schemaname, tablename 
                    FROM pg_tables 
                    WHERE tablename ILIKE '%history%';
                """)
                tables = db_cursor.fetchall()
                if tables:
                    print(f"FOUND in Database: {db_name}")
                    for s, t in tables:
                        print(f"  - {s}.{t}")
                    found = True
                db_conn.close()
            except Exception:
                pass
        
        if not found:
            print("No table with 'history' in name found in any database.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

find_history_table()
