from fastapi import FastAPI
from database import get_connection
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "server is running"}

class MessageCreate(BaseModel):
    conversation_id: int
    sender_id: int
    content: str 


'''
Inserts values into the messages data
'''
@app.post("/messages")
def send_message(message: MessageCreate):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute (
        """
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (%s, %s, %s)
        """,
        (message.conversation_id, message.sender_id, message.content)
    )

    conn.commit()
    cur.close()
    conn.close()

    return {"status": "message stored"}



@app.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT sender_id, content, timestamp
        FROM messages
        WHERE conversation_id = %s
        ORDER BY timestamp ASC
        """,
        (conversation_id,)
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    messages = []
    for row in rows:
        messages.append({
            "sender_id": row[0],
            "content": row[1],
            "timestamp": row[2]
        })

    return messages




