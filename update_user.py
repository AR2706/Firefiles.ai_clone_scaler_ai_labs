import sqlite3

def run():
    conn = sqlite3.connect(r'E:\fireflies.ai-clone\backend\data\app.db')
    conn.execute("UPDATE users SET name='Aritra Pradhan', email='aritra@meetnotes.app'")
    conn.commit()
    conn.close()
    print("User updated")

if __name__ == "__main__":
    run()
