import { API_BASE } from "./common.js";

console.log("login.js loaded");

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("uname")


if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim().toLowerCase();

        if (!username) return;

        const res = await fetch (
            `${API_BASE}/users/by-username/${username}`
        );

        const data = await res.json();

        if (data.error) {
            alert("User not found");
            return;
        }

        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", username);

        window.location.href = "../html/chat.html";
    });
}