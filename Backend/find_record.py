import psycopg2
from psycopg2 import OperationalError

filename_to_find = "67566c69-72af-4705-805a-43885a10e838.jpg"

def search_all_dbs():
    conn_str = "dbname='postgres' user='postgres' password='12345' host='localhost' port='5432'"
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        dbs = cursor.fetchall()
        
        found = False
        for db_name_tuple in dbs:
            db_name = db_name_tuple[0]
            try:
                db_conn = psycopg2.connect(f"dbname='{db_name}' user='postgres' password='12345' host='localhost' port='5432'")
                db_cursor = db_conn.cursor()
                # Find tables with a column like 'filename'
                db_cursor.execute("""
                    SELECT t.table_name, c.column_name 
                    FROM information_schema.tables t
                    JOIN information_schema.columns c ON t.table_name = c.table_name
                    WHERE t.table_schema = 'public' 
                    AND (c.column_name ILIKE '%filename%' OR c.column_name ILIKE '%path%');
                """)
                targets = db_cursor.fetchall()
                for table, column in targets:
                    query = f"SELECT count(*) FROM {table} WHERE {column} ILIKE %s"
                    db_cursor.execute(query, (f"%{filename_to_find}%",))
                    count = db_cursor.fetchone()[0]
                    if count > 0:
                        print(f"FOUND record in Database: {db_name}, Table: {table}, Column: {column}")
                        found = True
                db_conn.close()
            except Exception:
                pass
        
        if not found:
            print("No records found for that filename in any accessible database.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

search_all_dbs()
