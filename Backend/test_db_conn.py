import psycopg2
from psycopg2 import OperationalError

def test_connection(db_name):
    conn_str = f"dbname='{db_name}' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        print(f"Successfully connected to {db_name}")
        conn.close()
        return True
    except OperationalError as e:
        print(f"Failed to connect to {db_name}: {e}")
        return False

print("Testing database connections...")
test_connection("anomaly_detection")
test_connection("anomaly_detection_db")
