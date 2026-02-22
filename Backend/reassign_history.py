import psycopg2

def reassign_history():
    conn_str = "dbname='anomaly_detection' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        
        # Find the user ID for thinkbookg6irl@gmail.com
        cursor.execute("SELECT id FROM users WHERE email = 'thinkbookg6irl@gmail.com';")
        user_id = cursor.fetchone()
        
        if user_id:
            user_id = user_id[0]
            print(f"Reassigning all history records to UserID: {user_id} (thinkbookg6irl@gmail.com)")
            cursor.execute("UPDATE history SET user_id = %s;", (user_id,))
            conn.commit()
            print("Update complete.")
        else:
            print("User thinkbookg6irl@gmail.com not found.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

reassign_history()
