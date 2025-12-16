export const API_BASE = "http://127.0.0.1:8000";

export function getCurrentUserId() {
    return Number(localStorage.getItem("user_id"));
}

export function requireLogin() {
    const id = getCurrentUserId();
    if (!id) {
        window.location.href = "../html/login.html";
    }
    return id;
}
