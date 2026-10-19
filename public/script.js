import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Your Firebase web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQ1BBwXUOWH8CoFFrAHd8XZQUFnLQu4XY",
  authDomain: "ef-progress-tracker.firebaseapp.com",
  projectId: "ef-progress-tracker",
  storageBucket: "ef-progress-tracker.firebasestorage.app",
  messagingSenderId: "1073170506048",
  appId: "1:1073170506048:web:2eaf1ed69c0716a5245aa5",
  measurementId: "G-YHS4YQ5C0K",
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MAX_VALUE = 13500;

const users = [
  { name: "Rahat", id: "rahat" },
  { name: "Mohian", id: "mohian" },
  { name: "Minhaz", id: "minhaz" },
  { name: "Aqil", id: "aqil" },
  { name: "Shopnil", id: "shopnil" },
];

const container = document.getElementById("cardContainer");
const notification = document.getElementById("notification");
let notificationTimeout;

function showUpdatedNotification() {
  notification.classList.add("is-visible");
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notification.classList.remove("is-visible");
  }, 2200);
}

// Create dashboard cards
users.forEach((user, index) => {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="card-header">
      <div class="username">${user.name}</div>
      <div class="value-display">
        <span class="current" id="current-${index}">...</span>
        / ${MAX_VALUE}
      </div>
    </div>

    <div class="progress-track">
      <div class="progress-fill" id="fill-${index}"></div>
    </div>

    <div class="percent-label" id="percent-${index}">Loading...</div>

    <div class="controls">
      <input
        type="number"
        id="input-${index}"
        min="0"
        max="${MAX_VALUE}"
        step="1"
        placeholder="Enter value (0 - ${MAX_VALUE})"
      >
      <button type="button" id="set-${index}">Set</button>
    </div>
  `;

  container.appendChild(card);

  document
    .getElementById(`set-${index}`)
    .addEventListener("click", () => updateProgress(index));
});

// Render a value received from Firestore
function renderProgress(index, value) {
  const input = document.getElementById(`input-${index}`);
  const fill = document.getElementById(`fill-${index}`);
  const current = document.getElementById(`current-${index}`);
  const percentLabel = document.getElementById(`percent-${index}`);

  const percent = (value / MAX_VALUE) * 100;

  fill.style.width = `${percent}%`;
  current.textContent = value;
  percentLabel.textContent = `${percent.toFixed(1)}%`;

  // Don't overwrite a value while the visitor is typing
  if (document.activeElement !== input) {
    input.value = value;
  }
}

// Subscribe to live updates from Firestore
users.forEach((user, index) => {
  const userRef = doc(db, "progress", user.id);

  onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        console.error(`Missing Firestore document: ${user.id}`);
        document.getElementById(`current-${index}`).textContent = "Missing";
        document.getElementById(`percent-${index}`).textContent =
          "Document not found";
        return;
      }

      const value = snapshot.data().points;

      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > MAX_VALUE
      ) {
        console.error(`Invalid points value for ${user.id}`);
        document.getElementById(`current-${index}`).textContent = "Invalid";
        return;
      }

      renderProgress(index, value);
    },
    (error) => {
      console.error(`Could not read ${user.name}'s points:`, error);

      document.getElementById(`current-${index}`).textContent = "Error";
      document.getElementById(`percent-${index}`).textContent =
        "Could not load points";
    },
  );
});

// Save the submitted value to Firestore
async function updateProgress(index) {
  const input = document.getElementById(`input-${index}`);
  const rawValue = input.value.trim();
  const value = Number(rawValue);

  if (
    rawValue === "" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_VALUE
  ) {
    alert(`Enter a whole number between 0 and ${MAX_VALUE}.`);
    return;
  }

  const button = document.getElementById(`set-${index}`);
  button.disabled = true;

  try {
    const userRef = doc(db, "progress", users[index].id);

    await updateDoc(userRef, { points: value });
    // onSnapshot updates the display for all connected visitors.
    showUpdatedNotification();
  } catch (error) {
    console.error("Could not save points:", error);

    alert(
      "Couldn't save the value. Check your internet connection and Firestore rules.",
    );
  } finally {
    button.disabled = false;
  }
}

// Allow Enter to submit
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    event.target instanceof HTMLInputElement &&
    event.target.id.startsWith("input-")
  ) {
    const index = Number(event.target.id.split("-")[1]);

    if (Number.isInteger(index) && users[index]) {
      updateProgress(index);
    }
  }
});

// Theme toggle
const themeSwitch = document.getElementById("themeSwitch");

themeSwitch.addEventListener("change", () => {
  document.body.classList.toggle("light", themeSwitch.checked);
});
