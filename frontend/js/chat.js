import { API_BASE, requireLogin } from "./common.js";

const CURRENT_USER_ID = requireLogin();
let ACTIVE_CONVERSATION_ID = null;

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendbutton = document.getElementById("send-button");

const chatList = document.getElementById("chat-list");
const chatUsername = document.getElementById("chat-username");



// ---------- LOAD CONVERSATIONS ----------
async function loadConversations() {
    const res = await fetch(
        `${API_BASE}/conversations/for-user/${CURRENT_USER_ID}`
    );

    const conversations = await res.json();

    const chatList = document.getElementById("chat-list");
    chatList.innerHTML = "";

    conversations.forEach(conv => {
        const item = document.createElement("div");
        item.className = "chat-item";

        item.dataset.conversationId = conv.conversation_id;
        item.dataset.otherUserId = conv.other_user_id;
        item.dataset.username = conv.other_username;

        item.innerHTML = `
            <div class="avatar">${conv.other_username[0].toUpperCase()}</div>
            <div class="chat-info">
                <p class="name">${conv.other_username}</p>
                <p class="chat-preview">Click to open chat</p>
            </div>
        `;

        item.addEventListener("click", () => {

            document.querySelectorAll(".chat-item").forEach(el => 
                el.classList.remove("active")
            )
            item.classList.add("active");

            ACTIVE_CONVERSATION_ID = conv.conversation_id;

            document.getElementById("chat-username").textContent =
                conv.other_username;

            loadMessages();
        });

        chatList.appendChild(item);
    });
}


// ---------- LOAD MESSAGES ----------
async function loadMessages() {
    if (!ACTIVE_CONVERSATION_ID) return;

    const res = await fetch(
        `${API_BASE}/conversations/${ACTIVE_CONVERSATION_ID}/messages`
    );

    const messages = await res.json();

    messagesDiv.innerHTML = "";

    messages.forEach(msg => {
        const wrapper = document.createElement("div");

        if (msg.sender_id === CURRENT_USER_ID) {
            wrapper.className = "outgoing";
            wrapper.innerHTML = `<p class="text">${msg.content}</p>`;
        } else {
            wrapper.className = "incoming";
            wrapper.innerHTML = `
                <p class="sender">Other</p>
                <p class="text">${msg.content}</p>
            `;
        }

        messagesDiv.appendChild(wrapper);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// ---------- SEND MESSAGES ----------

async function sendMessage() {
    if (!ACTIVE_CONVERSATION_ID) {
        alert("Select a chat first");
        return;
    }

    const text = input.value.trim();
    if (!text) return;

    await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            conversation_id: ACTIVE_CONVERSATION_ID,
            sender_id: CURRENT_USER_ID,
            content: text
        })
    });

    input.value = "";
    loadMessages();
}


// ----------- EVENTS ------------
sendbutton.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});



// ---------- INIT ----------
loadConversations();
setInterval(loadMessages, 3000);