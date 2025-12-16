let CURRENT_USER_ID = null;

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("uname")


if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim().toLowerCase();

        if (!username) return;

        const res = await fetch (
            `${API_BASE}//users/by-username/{username}`
        );

        const data = await res.json();

        if (data.error) {
            alert("User not found");
            return;
        }

        CURRENT_USER_ID = data.user_id;


        document.getElementById("login-screen").style.display = "none";
        document.getElementById("chat-screen").style.display = "block";

        loadMessages();

    });
}

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendbutton = document.getElementById("send-button");

const API_BASE = "http://127.0.0.1:8000";
const CONVERSATION_ID = 1;
const OTHER_USER_NAME = "Alice"


async function loadMessages (){

    const res = await fetch(
        `${API_BASE}/conversations/${CONVERSATION_ID}/messages`
    );

    // the backend sends raw json and js must render it 
    const data = await res.json()
    messagesDiv.innerHTML = "";  // clearing old messages
    
    // rendering each message|
    data.forEach(msg => {
        const wrapper = document.createElement("div");

        if (msg.sender_id === CURRENT_USER_ID) {
            wrapper.className = "outgoing";
            wrapper.innerHTML = `<p class="text">${msg.content}</p>`;
            
        } else {
            wrapper.className = "incoming";
            wrapper.innerHTML = `<p class="sender">${OTHER_USER_NAME}</p>
                                <p class="text">${msg.content}</p>   
            `;
        }

        // attaching message to the DOM like a list
        messagesDiv.appendChild(wrapper);
    })

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

}


async function sendMessage(){
    if (CURRENT_USER_ID === null) {
        alert("Please log in first");
        return;
    }
    const text = input.value.trim();
    if (!text) return;

    await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            conversation_id: CONVERSATION_ID,
            sender_id: CURRENT_USER_ID,
            content: text
        })
    });

    input.value = "";
    loadMessages();
}

sendbutton.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

setInterval(() => {
    if (CURRENT_USER_ID !== null) {
        loadMessages();
    }
}, 3000);
