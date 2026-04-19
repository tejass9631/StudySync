// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3YacrMCmkhIjFLiAbMqFk75Of9DJBmyE",
  authDomain: "studysync-1a21e.firebaseapp.com",
  projectId: "studysync-1a21e",
  storageBucket: "studysync-1a21e.firebasestorage.app",
  messagingSenderId: "162935727458",
  appId: "1:162935727458:web:439eb442f317742899783b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= MAIN =================
window.addEventListener("DOMContentLoaded", () => {

  const profilePic = document.getElementById("profilePic");
  const fileInput = document.getElementById("fileInput");
  const nameInput = document.getElementById("nameInput");
  const welcomeUser = document.getElementById("welcomeUser");

  // ================= LOAD FOLDERS =================
  async function loadFolders(user) {
    const select = document.getElementById("folderSelect");
    if (!select || !user) return;

    select.innerHTML = '<option value="">Select Folder</option>';

    try {
      const snap = await getDocs(collection(db, "users", user.uid, "folders"));

      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.name) return;

        const option = document.createElement("option");
        option.value = docSnap.id;
        option.innerText = data.name;
        select.appendChild(option);
      });

    } catch (err) {
      console.log("Folder error:", err);
    }
  }

  // ================= USER =================
  onAuthStateChanged(auth, async (user) => {
    if (user) {

      await loadFolders(user);

      welcomeUser.innerText =
        "Welcome, " + (user.displayName || user.email);

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        nameInput.value = snap.data().name || "";
      }

      profilePic.src =
        user.photoURL ||
        localStorage.getItem("dp") ||
        "https://i.pravatar.cc/100";

    } else {
      window.location.href = "login.html";
    }
  });

  // ================= LOGOUT =================
  window.logout = () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  };

  // ================= MENU =================
  window.toggleMenu = () => {
    document.getElementById("menu").classList.toggle("hidden");
  };

  // ================= UPDATE NAME =================
  window.updateName = async () => {
    const user = auth.currentUser;
    const name = nameInput.value;

    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email
    });

    welcomeUser.innerText = "Welcome, " + name + " 👋";
    alert("Saved ✅");
  };

  // ================= PROFILE PIC =================
  fileInput.addEventListener("change", async function () {

    const file = this.files[0];
    if (!file) return;

    profilePic.src = "https://i.gifer.com/ZZ5H.gif";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "mypreset123");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dv5ph6z0w/image/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.secure_url) {
        profilePic.src = data.secure_url;
        localStorage.setItem("dp", data.secure_url);

        const user = auth.currentUser;
        if (user) {
          await updateProfile(user, {
            photoURL: data.secure_url
          });
        }
      }

    } catch {
      alert("Upload error ❌");
    }
  });

  // ================= UPLOAD NOTES =================
  window.uploadNote = async () => {

    const files = document.getElementById("noteImage").files;
    const folderId = document.getElementById("folderSelect").value;
    const noteLink = document.getElementById("noteLink");

    if (files.length === 0) return alert("Image select कर ❌");
    if (!folderId) return alert("Folder select कर ❌");

    noteLink.innerHTML = "Uploading... ⏳<br>";

    for (let file of files) {

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "mypreset123");

      const res = await fetch("https://api.cloudinary.com/v1_1/dv5ph6z0w/image/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.secure_url) {
        await addDoc(collection(db, "notes"), {
          url: data.secure_url,
          folderId,
          user: auth.currentUser.email,
          createdAt: new Date()
        });

        const p = document.createElement("p");
        p.innerText = data.secure_url;
        noteLink.appendChild(p);
      }
    }

    alert("Uploaded 🔥");
  };

  // ================= WEATHER =================
  async function loadWeather() {
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=25.6&longitude=85.1&current_weather=true");
    const data = await res.json();
    document.getElementById("weather").innerText =
      "🌡 " + data.current_weather.temperature + "°C";
  }
  loadWeather();

  // ================= SEARCH =================
  const searchInput = document.querySelector(".topbar input");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const value = this.value.toLowerCase();
      document.querySelectorAll(".card").forEach(card => {
        card.style.display =
          card.innerText.toLowerCase().includes(value) ? "block" : "none";
      });
    });
  }

  // ================= CHART =================
  const ctx = document.getElementById("myChart");

  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Math','Chemistry','English','WD','Python'],
        datasets: [{
          data: [90,40,50,60,90],
          backgroundColor: [
            '#6366F1','#22C55E','#F59E0B','#EF4444','#8B5CF6'
          ],
          borderRadius: 8
        }]
      },
      options: {
        animation: {
          duration: 1500,
          easing: 'easeOutBounce'
        },
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

});

