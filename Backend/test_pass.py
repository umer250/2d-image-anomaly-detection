import psycopg2
from psycopg2 import OperationalError

def test_password():
    conn_str = "dbname='postgres' user='postgres' password='password' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        print("Successfully connected with password='password'")
        conn.close()
    except OperationalError as e:
        print(f"Failed to connect with password='password': {e}")

test_password()
