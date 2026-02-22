import psycopg2

def list_app_users():
    conn_str = "dbname='anomaly_detection' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT email, role, is_active FROM users;")
        users = cursor.fetchall()
        print("Application Users:")
        for email, role, is_active in users:
            print(f"  - {email} ({role}), Active: {is_active}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

list_app_users()
