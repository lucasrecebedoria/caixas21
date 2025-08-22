import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, onSnapshot, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js";
import { firebaseConfig } from "./firebase.js";

// App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
getStorage(app);

// Admins por matrícula
const ADMINS = new Set(['4144', '70029', '6266']);

// UI refs
const authSection = document.getElementById('authSection');
const caixaSection = document.getElementById('caixaSection');
const userArea = document.getElementById('userArea');
const userNameSpan = document.getElementById('userName');
const userMatriculaSpan = document.getElementById('userMatricula');

const btnLogin = document.getElementById('btnLogin');
const btnCadastrar = document.getElementById('btnCadastrar');
const btnLogout = document.getElementById('btnLogout');
const btnChangePassword = document.getElementById('btnChangePassword');
const btnAbrirCaixa = document.getElementById('btnAbrirCaixa');
const btnFecharCaixa = document.getElementById('btnFecharCaixa');
const caixaStatus = document.getElementById('caixaStatus');
const mensagemStatus = document.getElementById('mensagemStatus');

const lancamentoCard = document.getElementById('lancamentoCard');
const sangriaCard = document.getElementById('sangriaCard');
const formsArea = document.getElementById('formsArea');

const loginMatricula = document.getElementById('loginMatricula');
const loginSenha = document.getElementById('loginSenha');
const cadMatricula = document.getElementById('cadMatricula');
const cadNome = document.getElementById('cadNome');
const cadSenha = document.getElementById('cadSenha');

// Campos de lançamento
const validadorSel = document.getElementById('validador');
const qtdBordosInp = document.getElementById('qtdBordos');
const valorInp = document.getElementById('valor');
const prefixoInp = document.getElementById('prefixo');
const dataCaixaInp = document.getElementById('dataCaixa');
const matMotoristaInp = document.getElementById('matMotorista');
const btnSalvarLancamento = document.getElementById('btnSalvarLancamento');

// Sangria
const valorSangriaInp = document.getElementById('valorSangria');
const motivoSangriaInp = document.getElementById('motivoSangria');
const btnPedirSangria = document.getElementById('btnPedirSangria');
const sangriaAviso = document.getElementById('sangriaAviso');
const sangriasPendentes = document.getElementById('sangriasPendentes');

// Sidebar
const sidebarToggle = document.getElementById('sidebarToggle');
const menu = document.getElementById('menu');

sidebarToggle.addEventListener('click', () => menu.classList.toggle('hidden'));
document.getElementById('menuAbertura').addEventListener('click', () => window.scrollTo({top: 0, behavior:'smooth'}));

// Helpers
const emailFromMatricula = (m) => `${m}@movebuss.local`;
const isAdminMatricula = (m) => ADMINS.has(m);
const brNow = () => new Date().toLocaleString('pt-BR');

// Persistência de sessão
setPersistence(auth, browserLocalPersistence);

// Atualiza valor automaticamente (qtd * 5)
function updateValor() {
  const qtd = parseInt(qtdBordosInp.value || '0', 10);
  valorInp.value = (qtd * 5).toFixed(2);
}
qtdBordosInp.addEventListener('input', updateValor);
updateValor();

// Prefixo: só 3 dígitos
prefixoInp.addEventListener('input', () => {
  prefixoInp.value = prefixoInp.value.replace(/\D/g,'').slice(0,3);
});

// Data BR mask simples
dataCaixaInp.addEventListener('input', () => {
  let v = dataCaixaInp.value.replace(/\D/g,'');
  if (v.length > 8) v = v.slice(0,8);
  if (v.length >= 5) dataCaixaInp.value = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
  else if (v.length >= 3) dataCaixaInp.value = v.slice(0,2) + '/' + v.slice(2);
  else dataCaixaInp.value = v;
});

// Auth
btnCadastrar.addEventListener('click', async () => {
  const m = cadMatricula.value.trim();
  const nome = cadNome.value.trim();
  const senha = cadSenha.value;
  if (!m || !nome || !senha) return alert('Preencha matrícula, nome e senha.');

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailFromMatricula(m), senha);
    const uid = cred.user.uid;
    await setDoc(doc(db, 'users', uid), {
      uid,
      matricula: m,
      nome,
      admin: isAdminMatricula(m),
      criadoEm: serverTimestamp()
    });
    alert('Cadastro realizado! Faça login.');
    // Redireciona para login
    loginMatricula.value = m;
    authSection.scrollIntoView({behavior: 'smooth'});
  } catch (e) {
    console.error(e); alert('Erro ao cadastrar: ' + e.message);
  }
});

btnLogin.addEventListener('click', async () => {
  const m = loginMatricula.value.trim();
  const senha = loginSenha.value;
  if (!m || !senha) return alert('Informe matrícula e senha.');
  try {
    await signInWithEmailAndPassword(auth, emailFromMatricula(m), senha);
  } catch (e) {
    console.error(e); alert('Erro ao entrar: ' + e.message);
  }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});

btnChangePassword.addEventListener('click', async () => {
  const nova = prompt('Nova senha:');
  if (!nova) return;
  if (auth.currentUser) {
    await updatePassword(auth.currentUser, nova);
    alert('Senha alterada!');
  }
});

let currentUser = null;
let caixaAbertoId = null;
let unsubWatcher = null;

function setLoggedUI(userDoc) {
  authSection.classList.add('hidden');
  caixaSection.classList.remove('hidden');
  userArea.style.display = 'flex';
  userNameSpan.textContent = userDoc.nome;
  userMatriculaSpan.textContent = userDoc.matricula;
  userMatriculaSpan.className = 'badge ' + (userDoc.admin ? 'badge-gold' : 'badge-green');
}

function setLoggedOutUI() {
  authSection.classList.remove('hidden');
  caixaSection.classList.add('hidden');
  userArea.style.display = 'none';
  if (unsubWatcher) unsubWatcher();
  caixaAbertoId = null;
}

// Watch auth
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
onAuthStateChanged(auth, async (u) => {
  if (!u) return setLoggedOutUI();
  const snap = await getDoc(doc(db, 'users', u.uid));
  if (!snap.exists()) return setLoggedOutUI();
  const userDoc = snap.data();
  currentUser = { ...userDoc, uid: u.uid };
  setLoggedUI(userDoc);
  watchCaixaAberto();
});

// Permitir 1 caixa aberto por usuário; usuários diferentes podem abrir os seus simultaneamente
async function watchCaixaAberto() {
  if (unsubWatcher) unsubWatcher();
  const qy = query(collection(db, 'users', currentUser.uid, 'caixas'), where('status', 'in', ['aberto', 'Caixa aberto']));
  unsubWatcher = onSnapshot(qy, (qs) => {
    if (qs.empty) {
      caixaAbertoId = null;
      caixaStatus.textContent = 'Caixa fechado';
      mensagemStatus.textContent = '⚠️ Caixa fechado – abra novamente para lançar.';
      btnAbrirCaixa.classList.remove('hidden');
      btnFecharCaixa.classList.add('hidden');
      // esconder formulários
      formsArea.classList.add('hidden');
    } else {
      const docRef = qs.docs[0];
      caixaAbertoId = docRef.id;
      caixaStatus.textContent = 'Caixa aberto';
      mensagemStatus.textContent = '';
      btnAbrirCaixa.classList.add('hidden');
      btnFecharCaixa.classList.remove('hidden');
      // mostrar formulários
      formsArea.classList.remove('hidden');
    }
  });
}

// Abrir novo caixa (sempre possível quando não há um aberto para esse usuário)
btnAbrirCaixa.addEventListener('click', async () => {
  try {
    // Certifica que não existe caixa aberto
    const qs = await getDocs(query(collection(db, 'users', currentUser.uid, 'caixas'), where('status','==','aberto')));
    if (!qs.empty) return alert('Já existe um caixa aberto. Feche antes de abrir outro.');
    const ref = await addDoc(collection(db, 'users', currentUser.uid, 'caixas'), {
      status: 'aberto',
      aberto: true,
      dataAbertura: new Date().toISOString(),
      matriculaRecebedor: currentUser.matricula,
      sangriaTotal: 0,
      criadoEm: serverTimestamp()
    });
    caixaAbertoId = ref.id;
    alert('Caixa aberto!');
  } catch (e) {
    console.error(e); alert('Erro ao abrir caixa: ' + e.message);
  }
});

// Fechar caixa
btnFecharCaixa.addEventListener('click', async () => {
  if (!caixaAbertoId) return alert('Nenhum caixa aberto.');
  try {
    const cRef = doc(db, 'users', currentUser.uid, 'caixas', caixaAbertoId);
    // calcula totais
    const lq = await getDocs(collection(db, 'users', currentUser.uid, 'caixas', caixaAbertoId, 'lancamentos'));
    let totalAbastecido = 0;
    const lancs = [];
    lq.forEach(d => { const x = d.data(); lancs.push(x); totalAbastecido += Number(x.valor || 0); });

    const sq = await getDocs(collection(db, 'users', currentUser.uid, 'caixas', caixaAbertoId, 'sangrias'));
    let totalSangria = 0;
    sq.forEach(d => { const x = d.data(); if (x.status === 'aprovada') totalSangria += Number(x.valor || 0); });

    const valorCorrigido = totalAbastecido - totalSangria;

    await updateDoc(cRef, {
      status: 'fechado',
      aberto: false,
      dataFechamento: new Date().toISOString(),
      totalAbastecido, totalSangria, valorCorrigido
    });

    // Gera PDF A4
    await gerarRelatorioFechamento(lancs, { totalAbastecido, totalSangria, valorCorrigido }, currentUser.matricula);

    alert('Caixa fechado.');
  } catch (e) {
    console.error(e); alert('Erro ao fechar caixa: ' + e.message);
  }
});

// Salvar lançamento (só com caixa aberto)
btnSalvarLancamento.addEventListener('click', async () => {
  if (!caixaAbertoId) return alert('Abra um caixa antes de lançar.');
  const qtd = parseInt(qtdBordosInp.value || '0', 10);
  if (!qtd) return alert('Informe a quantidade de bordos.');
  const prefixo = prefixoInp.value.trim();
  if (prefixo.length !== 3) return alert('Prefixo precisa de 3 dígitos.');

  const dados = {
    validador: validadorSel.value,
    qtd: qtd,
    valor: qtd * 5,
    prefixo: prefixo,
    data: new Date().toISOString(),
    dataCaixa: dataCaixaInp.value,
    motorista: matMotoristaInp.value.trim(),
    recebedor: currentUser.matricula
  };

  try {
    await addDoc(collection(db, 'users', currentUser.uid, 'caixas', caixaAbertoId, 'lancamentos'), dados);
    // imprime recibo térmico
    printRecibo(dados);
    alert('Lançamento salvo.');
  } catch (e) {
    console.error(e); alert('Erro ao salvar lançamento: ' + e.message);
  }
});

// Sangria: cria solicitação pendente
btnPedirSangria.addEventListener('click', async () => {
  if (!caixaAbertoId) return alert('Abra um caixa antes de solicitar sangria.');
  const valor = parseFloat(valorSangriaInp.value || '0');
  const motivo = motivoSangriaInp.value.trim();
  if (!valor || !motivo) return alert('Informe valor e motivo.');
  try {
    await addDoc(collection(db, 'users', currentUser.uid, 'caixas', caixaAbertoId, 'sangrias'), {
      valor, motivo, solicitante: currentUser.matricula, status: 'pendente', data: new Date().toISOString()
    });
    sangriaAviso.textContent = 'Solicitação de sangria enviada. Aguarde aprovação do admin.';
    valorSangriaInp.value = ''; motivoSangriaInp.value = '';
  } catch (e) {
    console.error(e); alert('Erro ao solicitar sangria: ' + e.message);
  }
});

// Aprovação de sangria (somente admin) – simples via prompt
document.addEventListener('keydown', async (ev) => {
  // Atalho: Ctrl+Shift+A para aprovar sangrias pendentes do caixa atual
  if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === 'a') {
    if (!currentUser || !ADMINS.has(currentUser.matricula)) return;
    if (!caixaAbertoId) return;
    const base = collection(db, 'users', currentUser.uid, 'caixas', caixaAbertoId, 'sangrias');
    const snap = await getDocs(base);
    for (const d of snap.docs) {
      const x = d.data();
      if (x.status === 'pendente') {
        await updateDoc(doc(db, 'users', currentUser.uid, 'caixas', caixaAbertoId, 'sangrias', d.id), {
          status: 'aprovada', autorizadoPor: currentUser.matricula, dataAutorizacao: new Date().toISOString()
        });
      }
    }
    alert('Sangrias pendentes aprovadas.');
  }
});

// Atualiza lista de sangrias pendentes (informativo)
async function refreshSangriasPendentes() {
  if (!caixaAbertoId) { sangriasPendentes.textContent = ''; return; }
  const snap = await getDocs(collection(db, 'users', currentUser.uid, 'caixas', caixaAbertoId, 'sangrias'));
  const pend = [];
  snap.forEach(d => { const x = d.data(); if (x.status === 'pendente') pend.push(x); });
  if (pend.length) {
    sangriasPendentes.textContent = `Pendentes: ${pend.length} (aguardando admin)`;
  } else {
    sangriasPendentes.textContent = '';
  }
}
setInterval(refreshSangriasPendentes, 4000);

// Impressão térmica 80x150mm estilizada
function printRecibo(dados) {
  const w = window.open('', '', 'width=300,height=700');
  w.document.write(`
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: 80mm 150mm; margin: 0; }
        body {
          width: 80mm; height: 150mm; margin: 0; padding: 8px 10px;
          font-family: monospace; font-size: 16px;
        }
        .title { text-align: center; font-weight: bold; font-size: 18px; margin: 6px 0 10px; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .label { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .right { text-align: right; }
        .signature { margin-top: 22px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="title">RECIBO DE PAGAMENTO MANUAL</div>
      <div class="line"></div>
      <div class="row"><div class="label">Tipo de validador:</div><div class="right">${dados.validador}</div></div>
      <div class="row"><div class="label">PREFIXO:</div><div class="right">55${dados.prefixo}</div></div>
      <div class="row"><div class="label">QUANTIDADE BORDOS:</div><div class="right">${dados.qtd}</div></div>
      <div class="row"><div class="label">VALOR:</div><div class="right">R$ ${Number(dados.valor).toFixed(2)}</div></div>
      <div class="row"><div class="label">MATRICULA MOTORISTA:</div><div class="right">${dados.motorista}</div></div>
      <div class="row"><div class="label">MATRICULA RECEBEDOR:</div><div class="right">${dados.recebedor}</div></div>
      <div class="row"><div class="label">DATA RECEBIMENTO:</div><div class="right">${new Date().toLocaleString('pt-BR')}</div></div>
      <div class="line"></div>
      <div class="signature">
        <div class="label">ASSINATURA RECEBEDOR:</div>
        <div>_____________________________</div>
      </div>
      <script>window.print(); setTimeout(()=>window.close(), 400);</script>
    </body>
    </html>
  `);
  w.document.close();
}

// Relatório A4 com jsPDF
async function gerarRelatorioFechamento(lancamentos, resumo, matricula) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  // Logo
  try {
    const img = new Image();
    img.src = 'assets/MOVE_BUSS_LOGO02.png';
    await new Promise(res => { img.onload = res; img.onerror = res; });
    doc.addImage(img, 'PNG', 10, 10, 40, 16);
  } catch(e) {}

  doc.setFontSize(18);
  doc.text('RELATÓRIO DE FECHAMENTO DE CAIXA', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Matrícula Recebedor: ${matricula}`, 14, 32);

  let y = 40;
  lancamentos.forEach((item, i) => {
    doc.setFontSize(12);
    doc.text(`Lançamento ${i+1}`, 14, y); y += 6;
    doc.setFont('helvetica','bold'); doc.text('Validador:', 14, y); doc.setFont('helvetica','normal'); doc.text(String(item.validador||''), 50, y); y += 6;
    doc.setFont('helvetica','bold'); doc.text('Prefixo:', 14, y); doc.setFont('helvetica','normal'); doc.text('55' + String(item.prefixo||''), 50, y); y += 6;
    doc.setFont('helvetica','bold'); doc.text('Qtd Bordos:', 14, y); doc.setFont('helvetica','normal'); doc.text(String(item.qtd||0), 50, y); y += 6;
    doc.setFont('helvetica','bold'); doc.text('Valor:', 14, y); doc.setFont('helvetica','normal'); doc.text(`R$ ${(Number(item.valor)||0).toFixed(2)}`, 50, y); y += 6;
    doc.setFont('helvetica','bold'); doc.text('Motorista:', 14, y); doc.setFont('helvetica','normal'); doc.text(String(item.motorista||''), 50, y); y += 6;
    doc.setFont('helvetica','bold'); doc.text('Data/Hora:', 14, y); doc.setFont('helvetica','normal'); doc.text(new Date(item.data||Date.now()).toLocaleString('pt-BR'), 50, y); y += 8;
    doc.line(14, y, 196, y); y += 6;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text('Resumo Final', 105, y, { align: 'center' }); y += 8;
  doc.setFont('helvetica','normal'); doc.setFontSize(12);
  doc.text(`Total Abastecido: R$ ${(resumo.totalAbastecido||0).toFixed(2)}`, 14, y); y += 6;
  doc.text(`Total Sangria: R$ ${(resumo.totalSangria||0).toFixed(2)}`, 14, y); y += 6;
  doc.text(`Valor Corrigido: R$ ${(resumo.valorCorrigido||0).toFixed(2)}`, 14, y); y += 6;
  doc.text(`Fechado em: ${new Date().toLocaleString('pt-BR')}`, 14, y);

  const hoje = new Date().toISOString().slice(0,10);
  doc.save(`${matricula}-${hoje}.pdf`);
}
