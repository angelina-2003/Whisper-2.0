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


@app.get("/users/by-username/{username}")
def get_user_by_username(username: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id
        FROM users 
        WHERE LOWER(username) = LOWER(%s)
        """, (username,)
    )

    row = cur.fetchone()

    cur.close()
    conn.close()

    if row is None:
          return {"error": "User not found"}

    return {"user_id": row[0]}



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


@app.get("/conversations/between/{user1_id}/{user2_id}")
def get_or_create_conversation(user1_id: int, user2_id: int):
    conn = get_connection()
    cur = conn.cursor()

    # try to find existing conversation
    cur.execute("""
        SELECT id FROM conversations
        WHERE 
            (user1_id = %s AND user2_id = %s)
            OR
            (user1_id = %s AND user2_id = %s)
    """, (user1_id, user2_id, user2_id, user1_id))

    row = cur.fetchone()

    if row:
        cur.close()
        conn.close()
        return {"conversation_id": row[0]}

    # else create one
    cur.execute("""
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (%s, %s)
        RETURNING id
    """, (user1_id, user2_id))

    conversation_id = cur.fetchone()[0]
    conn.commit()

    return {"conversation_id": conversation_id}


@app.get("/conversations/for-user/{user_id}")
def get_conversations_for_user(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT
            c.id AS conversation_id,
            CASE
                WHEN c.user1_id = %s THEN u2.id
                ELSE u1.id
            END AS other_user_id,
            CASE
                WHEN c.user1_id = %s THEN u2.username
                ELSE u1.username
            END AS other_username
        FROM conversations c
        JOIN users u1 ON u1.id = c.user1_id
        JOIN users u2 ON u2.id = c.user2_id
        WHERE c.user1_id = %s OR c.user2_id = %s
        ORDER BY c.id DESC
    """, (user_id, user_id, user_id, user_id))


    rows = cur.fetchall()

    cur.close()
    conn.close()

    conversations = []
    for row in rows:
        conversations.append({
            "conversation_id": row[0],
            "other_user_id": row[1],
            "other_username": row[2]
        })

    return conversations


