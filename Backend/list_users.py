import psycopg2
from psycopg2 import OperationalError

def list_users():
    conn_str = "dbname='postgres' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("SELECT usename FROM pg_user;")
        users = cursor.fetchall()
        print("Available users:")
        for u in users:
            print(f"  - {u[0]}")
        conn.close()
    except OperationalError as e:
        print(f"Failed to connect to postgres: {e}")

list_users()
