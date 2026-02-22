import psycopg2
from psycopg2 import OperationalError

def list_tables():
    conn_str = "dbname='anomaly_detection' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = cursor.fetchall()
        print("Tables in 'anomaly_detection':")
        for t in tables:
            print(f"  - {t[0]}")
        conn.close()
    except OperationalError as e:
        print(f"Failed to connect: {e}")

list_tables()
