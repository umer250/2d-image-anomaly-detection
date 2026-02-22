import psycopg2

def verify_counts():
    conn_str = "dbname='anomaly_detection' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM results;")
        results_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM history;")
        history_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM images;")
        images_count = cursor.fetchone()[0]
        
        print(f"Record Counts:")
        print(f"  Images: {images_count}")
        print(f"  Results: {results_count}")
        print(f"  History: {history_count}")
        
        print("\nResults Details:")
        cursor.execute("SELECT r.id, i.filename, r.anomaly_score FROM results r JOIN images i ON r.image_id = i.id;")
        for r in cursor.fetchall():
            print(f"  ID: {r[0]}, Filename: {r[1]}, Score: {r[2]}")
            
        print("\nHistory Details:")
        cursor.execute("SELECT id, filename, score FROM history;")
        for h in cursor.fetchall():
            print(f"  ID: {h[0]}, Filename: {h[1]}, Score: {h[2]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

verify_counts()
