import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

document.getElementById("registerBtn").addEventListener("click", async () => {
  const matricula = document.getElementById("matricula").value;
  const nome = document.getElementById("nome").value;
  const senha = document.getElementById("senha").value;
  const email = `${matricula}@movebuss.local`;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, "users", cred.user.uid), {
      matricula,
      nome,
      role: "user"
    });
    alert("Cadastro realizado com sucesso!");
    window.location.href = "index.html";
  } catch (err) {
    alert("Erro no cadastro: " + err.message);
  }
});
