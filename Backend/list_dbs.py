import psycopg2
from psycopg2 import OperationalError

def list_databases():
    conn_str = "dbname='postgres' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        databases = cursor.fetchall()
        print("Available databases:")
        for db in databases:
            print(f"  - {db[0]}")
        conn.close()
    except OperationalError as e:
        print(f"Failed to connect to postgres: {e}")

list_databases()
