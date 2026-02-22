import psycopg2

def check_history():
    conn_str = "dbname='anomaly_detection' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT id, user_id, filename, status, score FROM history;")
        records = cursor.fetchall()
        print("History Table Content:")
        for r in records:
            print(f"  ID: {r[0]}, UserID: {r[1]}, Filename: {r[2]}, Status: {r[3]}, Score: {r[4]}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

check_history()
