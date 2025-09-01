import psycopg2
import os

def init_db(app):
    
    try:   

        DbConnection = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        
        app.db_connection = DbConnection

        print("✅ Banco de dados conectado com sucesso!")

    except Exception as e:
        
        print("❌ Erro ao conectar ao banco de dados:", e)