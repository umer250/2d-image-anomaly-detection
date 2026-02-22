import psycopg2

def sync_results_to_history_enhanced():
    conn_str = "dbname='anomaly_detection' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        
        # Get all results and their associated images
        cursor.execute("""
            SELECT i.user_id, i.filename, i.file_path, r.anomaly_score, r.is_anomaly, 
                   r.heatmap_path, r.threshold, r.model_version, r.created_at
            FROM results r
            JOIN images i ON r.image_id = i.id;
        """)
        results = cursor.fetchall()
        
        print(f"Syncing {len(results)} results to history (enhanced)...")
        
        for user_id, filename, file_path, score, is_anomaly, heatmap_path, threshold, model_version, created_at in results:
            status = "Anomaly" if is_anomaly else "Normal"
            
            # Check if already in history
            cursor.execute("SELECT id FROM history WHERE filename = %s;", (filename,))
            row = cursor.fetchone()
            
            if not row:
                cursor.execute("""
                    INSERT INTO history (user_id, filename, file_path, status, score, 
                                       heatmap_path, threshold, model_version, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (user_id, filename, file_path, status, score, 
                      heatmap_path, threshold, model_version, created_at))
                print(f"  Inserted {filename}")
            else:
                # Update existing record with the new fields
                cursor.execute("""
                    UPDATE history 
                    SET heatmap_path = %s, threshold = %s, model_version = %s
                    WHERE id = %s;
                """, (heatmap_path, threshold, model_version, row[0]))
                print(f"  Updated {filename}")
                
        conn.commit()
        conn.close()
        print("Sync complete.")
    except Exception as e:
        print(f"Error: {e}")

sync_results_to_history_enhanced()
