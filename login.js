import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxQliXm59BRg9zsVpK5qthB0nowqU0GEg",
  authDomain: "lancamentomanual-6cac4.firebaseapp.com",
  projectId: "lancamentomanual-6cac4",
  storageBucket: "lancamentomanual-6cac4.appspot.com",
  messagingSenderId: "1088358469725",
  appId: "1:1088358469725:web:xxxxx"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginBtn").addEventListener("click", async () => {
  const matricula = document.getElementById("matricula").value;
  const senha = document.getElementById("senha").value;
  const email = `${matricula}@movebuss.local`;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "painel.html";
  } catch (err) {
    alert("Erro no login: " + err.message);
  }
});
