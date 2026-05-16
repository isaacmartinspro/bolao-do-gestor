import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref as dbRef, set, get, onValue, off, push, update, remove } from "firebase/database";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCcXAm_1AuVNSG98VkltUKOU8ov_EG3K8A",
  authDomain:        "bolao-do-gestor.firebaseapp.com",
  databaseURL:       "https://bolao-do-gestor-default-rtdb.firebaseio.com",
  projectId:         "bolao-do-gestor",
  storageBucket:     "bolao-do-gestor.firebasestorage.app",
  messagingSenderId: "1062610341798",
  appId:             "1:1062610341798:web:6c069efa7673e4d8d34967",
  measurementId:     "G-T4GJS0CV1J",
};

const ADMIN_PASS  = "copa2026";
const ADMIN_KEY   = "isaac_admin";

// ─── CALENDÁRIO OFICIAL FIFA ──────────────────────────────────────────────────
const SCHEDULE = [
  {id:1,  home:"México",            away:"África do Sul",      group:"A", date:"2026-06-11T16:00", city:"Cidade do México"},
  {id:2,  home:"Coreia do Sul",     away:"Tchéquia",           group:"A", date:"2026-06-11T23:00", city:"Guadalajara"},
  {id:25, home:"Tchéquia",          away:"África do Sul",      group:"A", date:"2026-06-18T13:00", city:"Atlanta"},
  {id:28, home:"México",            away:"Coreia do Sul",      group:"A", date:"2026-06-18T22:00", city:"Guadalajara"},
  {id:53, home:"Tchéquia",          away:"México",             group:"A", date:"2026-06-24T22:00", city:"Cidade do México"},
  {id:54, home:"África do Sul",     away:"Coreia do Sul",      group:"A", date:"2026-06-24T22:00", city:"Monterrey"},
  {id:3,  home:"Canadá",            away:"Bósnia-Herzegovina", group:"B", date:"2026-06-12T16:00", city:"Toronto"},
  {id:8,  home:"Catar",             away:"Suíça",              group:"B", date:"2026-06-13T16:00", city:"São Francisco"},
  {id:26, home:"Suíça",             away:"Bósnia-Herzegovina", group:"B", date:"2026-06-18T16:00", city:"Los Angeles"},
  {id:27, home:"Canadá",            away:"Catar",              group:"B", date:"2026-06-18T19:00", city:"Vancouver"},
  {id:51, home:"Suíça",             away:"Canadá",             group:"B", date:"2026-06-24T16:00", city:"Vancouver"},
  {id:52, home:"Bósnia-Herzegovina",away:"Catar",              group:"B", date:"2026-06-24T16:00", city:"Seattle"},
  {id:7,  home:"Brasil",            away:"Marrocos",           group:"C", date:"2026-06-13T19:00", city:"Nova York"},
  {id:5,  home:"Haiti",             away:"Escócia",            group:"C", date:"2026-06-13T22:00", city:"Boston"},
  {id:30, home:"Escócia",           away:"Marrocos",           group:"C", date:"2026-06-19T19:00", city:"Boston"},
  {id:29, home:"Brasil",            away:"Haiti",              group:"C", date:"2026-06-19T22:00", city:"Filadélfia"},
  {id:49, home:"Escócia",           away:"Brasil",             group:"C", date:"2026-06-24T19:00", city:"Miami"},
  {id:50, home:"Marrocos",          away:"Haiti",              group:"C", date:"2026-06-24T19:00", city:"Atlanta"},
  {id:4,  home:"EUA",               away:"Paraguai",           group:"D", date:"2026-06-12T22:00", city:"Los Angeles"},
  {id:6,  home:"Austrália",         away:"Turquia",            group:"D", date:"2026-06-13T01:00", city:"Vancouver"},
  {id:31, home:"Turquia",           away:"Paraguai",           group:"D", date:"2026-06-19T01:00", city:"São Francisco"},
  {id:32, home:"EUA",               away:"Austrália",          group:"D", date:"2026-06-19T16:00", city:"Seattle"},
  {id:59, home:"Turquia",           away:"EUA",                group:"D", date:"2026-06-25T23:00", city:"Los Angeles"},
  {id:60, home:"Paraguai",          away:"Austrália",          group:"D", date:"2026-06-25T23:00", city:"São Francisco"},
  {id:10, home:"Alemanha",          away:"Curaçao",            group:"E", date:"2026-06-14T14:00", city:"Houston"},
  {id:9,  home:"Costa do Marfim",   away:"Equador",            group:"E", date:"2026-06-14T20:00", city:"Filadélfia"},
  {id:33, home:"Alemanha",          away:"Costa do Marfim",    group:"E", date:"2026-06-20T17:00", city:"Toronto"},
  {id:34, home:"Equador",           away:"Curaçao",            group:"E", date:"2026-06-20T21:00", city:"Kansas City"},
  {id:55, home:"Curaçao",           away:"Costa do Marfim",    group:"E", date:"2026-06-25T17:00", city:"Filadélfia"},
  {id:56, home:"Equador",           away:"Alemanha",           group:"E", date:"2026-06-25T17:00", city:"Nova York"},
  {id:11, home:"Holanda",           away:"Japão",              group:"F", date:"2026-06-14T17:00", city:"Dallas"},
  {id:12, home:"Suécia",            away:"Tunísia",            group:"F", date:"2026-06-14T23:00", city:"Monterrey"},
  {id:35, home:"Holanda",           away:"Suécia",             group:"F", date:"2026-06-20T14:00", city:"Houston"},
  {id:36, home:"Tunísia",           away:"Japão",              group:"F", date:"2026-06-20T01:00", city:"Monterrey"},
  {id:57, home:"Japão",             away:"Suécia",             group:"F", date:"2026-06-25T20:00", city:"Dallas"},
  {id:58, home:"Tunísia",           away:"Holanda",            group:"F", date:"2026-06-25T20:00", city:"Kansas City"},
  {id:16, home:"Bélgica",           away:"Egito",              group:"G", date:"2026-06-15T16:00", city:"Seattle"},
  {id:15, home:"Irã",               away:"Nova Zelândia",      group:"G", date:"2026-06-15T22:00", city:"Los Angeles"},
  {id:39, home:"Bélgica",           away:"Irã",                group:"G", date:"2026-06-21T16:00", city:"Los Angeles"},
  {id:40, home:"Nova Zelândia",     away:"Egito",              group:"G", date:"2026-06-21T22:00", city:"Vancouver"},
  {id:63, home:"Egito",             away:"Irã",                group:"G", date:"2026-06-27T00:00", city:"Seattle"},
  {id:64, home:"Nova Zelândia",     away:"Bélgica",            group:"G", date:"2026-06-27T00:00", city:"Vancouver"},
  {id:14, home:"Espanha",           away:"Cabo Verde",         group:"H", date:"2026-06-15T13:00", city:"Atlanta"},
  {id:13, home:"Arábia Saudita",    away:"Uruguai",            group:"H", date:"2026-06-15T19:00", city:"Miami"},
  {id:38, home:"Espanha",           away:"Arábia Saudita",     group:"H", date:"2026-06-21T13:00", city:"Atlanta"},
  {id:37, home:"Uruguai",           away:"Cabo Verde",         group:"H", date:"2026-06-21T19:00", city:"Miami"},
  {id:65, home:"Cabo Verde",        away:"Arábia Saudita",     group:"H", date:"2026-06-26T21:00", city:"Houston"},
  {id:66, home:"Uruguai",           away:"Espanha",            group:"H", date:"2026-06-26T21:00", city:"Guadalajara"},
  {id:17, home:"França",            away:"Senegal",            group:"I", date:"2026-06-16T16:00", city:"Nova York"},
  {id:18, home:"Iraque",            away:"Noruega",            group:"I", date:"2026-06-16T19:00", city:"Boston"},
  {id:42, home:"França",            away:"Iraque",             group:"I", date:"2026-06-22T18:00", city:"Filadélfia"},
  {id:41, home:"Noruega",           away:"Senegal",            group:"I", date:"2026-06-22T21:00", city:"Nova York"},
  {id:61, home:"Noruega",           away:"França",             group:"I", date:"2026-06-26T16:00", city:"Boston"},
  {id:62, home:"Senegal",           away:"Iraque",             group:"I", date:"2026-06-26T16:00", city:"Toronto"},
  {id:20, home:"Áustria",           away:"Jordânia",           group:"J", date:"2026-06-16T01:00", city:"São Francisco"},
  {id:19, home:"Argentina",         away:"Argélia",            group:"J", date:"2026-06-16T22:00", city:"Kansas City"},
  {id:43, home:"Argentina",         away:"Áustria",            group:"J", date:"2026-06-22T14:00", city:"Dallas"},
  {id:44, home:"Jordânia",          away:"Argélia",            group:"J", date:"2026-06-22T00:00", city:"São Francisco"},
  {id:69, home:"Argélia",           away:"Áustria",            group:"J", date:"2026-06-27T23:00", city:"Kansas City"},
  {id:70, home:"Jordânia",          away:"Argentina",          group:"J", date:"2026-06-27T23:00", city:"Dallas"},
  {id:23, home:"Portugal",          away:"RD Congo",           group:"K", date:"2026-06-17T14:00", city:"Houston"},
  {id:24, home:"Uzbequistão",       away:"Colômbia",           group:"K", date:"2026-06-17T23:00", city:"Cidade do México"},
  {id:47, home:"Portugal",          away:"Uzbequistão",        group:"K", date:"2026-06-23T14:00", city:"Houston"},
  {id:48, home:"Colômbia",          away:"RD Congo",           group:"K", date:"2026-06-23T23:00", city:"Guadalajara"},
  {id:71, home:"Colômbia",          away:"Portugal",           group:"K", date:"2026-06-27T20:30", city:"Miami"},
  {id:72, home:"RD Congo",          away:"Uzbequistão",        group:"K", date:"2026-06-27T20:30", city:"Atlanta"},
  {id:22, home:"Inglaterra",        away:"Croácia",            group:"L", date:"2026-06-17T17:00", city:"Dallas"},
  {id:21, home:"Gana",              away:"Panamá",             group:"L", date:"2026-06-17T20:00", city:"Toronto"},
  {id:45, home:"Inglaterra",        away:"Gana",               group:"L", date:"2026-06-23T17:00", city:"Boston"},
  {id:46, home:"Panamá",            away:"Croácia",            group:"L", date:"2026-06-23T20:00", city:"Toronto"},
  {id:67, home:"Panamá",            away:"Inglaterra",         group:"L", date:"2026-06-27T18:00", city:"Nova York"},
  {id:68, home:"Croácia",           away:"Gana",               group:"L", date:"2026-06-27T18:00", city:"Filadélfia"},
  // FASES ELIMINATÓRIAS
  {id:73, home:"2º A",away:"2º B",group:"32avos",date:"2026-06-28T16:00",city:"Los Angeles",knockout:true},
  {id:74, home:"1º E",away:"3º Melhor",group:"32avos",date:"2026-06-29T17:30",city:"Boston",knockout:true},
  {id:75, home:"1º F",away:"2º C",group:"32avos",date:"2026-06-29T22:00",city:"Monterrey",knockout:true},
  {id:76, home:"1º C",away:"2º F",group:"32avos",date:"2026-06-29T14:00",city:"Houston",knockout:true},
  {id:77, home:"1º I",away:"3º Melhor",group:"32avos",date:"2026-06-30T18:00",city:"Nova York",knockout:true},
  {id:78, home:"2º E",away:"2º I",group:"32avos",date:"2026-06-30T14:00",city:"Dallas",knockout:true},
  {id:79, home:"1º A",away:"3º Melhor",group:"32avos",date:"2026-06-30T22:00",city:"Cidade do México",knockout:true},
  {id:80, home:"1º L",away:"3º Melhor",group:"32avos",date:"2026-07-01T13:00",city:"Atlanta",knockout:true},
  {id:81, home:"1º D",away:"3º Melhor",group:"32avos",date:"2026-07-01T21:00",city:"São Francisco",knockout:true},
  {id:82, home:"1º G",away:"3º Melhor",group:"32avos",date:"2026-07-01T17:00",city:"Seattle",knockout:true},
  {id:83, home:"2º K",away:"2º L",group:"32avos",date:"2026-07-02T20:00",city:"Toronto",knockout:true},
  {id:84, home:"1º H",away:"2º J",group:"32avos",date:"2026-07-02T16:00",city:"Los Angeles",knockout:true},
  {id:85, home:"1º B",away:"3º Melhor",group:"32avos",date:"2026-07-02T00:00",city:"Vancouver",knockout:true},
  {id:86, home:"1º J",away:"2º H",group:"32avos",date:"2026-07-03T17:00",city:"Atlanta",knockout:true},
  {id:87, home:"1º K",away:"3º Melhor",group:"32avos",date:"2026-07-03T22:30",city:"Kansas City",knockout:true},
  {id:88, home:"2º D",away:"2º G",group:"32avos",date:"2026-07-03T15:00",city:"Dallas",knockout:true},
  {id:89, home:"W74",away:"W77",group:"Oitavas",date:"2026-07-04T18:00",city:"Filadélfia",knockout:true},
  {id:90, home:"W73",away:"W75",group:"Oitavas",date:"2026-07-04T14:00",city:"Houston",knockout:true},
  {id:91, home:"W76",away:"W78",group:"Oitavas",date:"2026-07-05T17:00",city:"Nova York",knockout:true},
  {id:92, home:"W79",away:"W80",group:"Oitavas",date:"2026-07-05T21:00",city:"Cidade do México",knockout:true},
  {id:93, home:"W83",away:"W84",group:"Oitavas",date:"2026-07-06T15:00",city:"Dallas",knockout:true},
  {id:94, home:"W81",away:"W82",group:"Oitavas",date:"2026-07-06T20:00",city:"Seattle",knockout:true},
  {id:95, home:"W86",away:"W88",group:"Oitavas",date:"2026-07-07T13:00",city:"Atlanta",knockout:true},
  {id:96, home:"W85",away:"W87",group:"Oitavas",date:"2026-07-07T17:00",city:"Vancouver",knockout:true},
  {id:97, home:"W89",away:"W90",group:"Quartas",date:"2026-07-09T17:00",city:"Boston",knockout:true},
  {id:98, home:"W93",away:"W94",group:"Quartas",date:"2026-07-10T16:00",city:"Los Angeles",knockout:true},
  {id:99, home:"W91",away:"W92",group:"Quartas",date:"2026-07-11T18:00",city:"Miami",knockout:true},
  {id:100,home:"W95",away:"W96",group:"Quartas",date:"2026-07-11T21:00",city:"Kansas City",knockout:true},
  {id:101,home:"W97",away:"W98",group:"Semifinal",date:"2026-07-14T16:00",city:"Dallas",knockout:true},
  {id:102,home:"W99",away:"W100",group:"Semifinal",date:"2026-07-15T16:00",city:"Dallas",knockout:true},
  {id:103,home:"L101",away:"L102",group:"3º Lugar",date:"2026-07-18T18:00",city:"Miami",knockout:true},
  {id:104,home:"W101",away:"W102",group:"Final",date:"2026-07-19T16:00",city:"Nova York",knockout:true},
];

const FLAGS = {
  "Brasil":"🇧🇷","Argentina":"🇦🇷","França":"🇫🇷","Alemanha":"🇩🇪","Espanha":"🇪🇸",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Portugal":"🇵🇹","México":"🇲🇽","EUA":"🇺🇸","Uruguai":"🇺🇾",
  "Colômbia":"🇨🇴","Canadá":"🇨🇦","Equador":"🇪🇨","Panamá":"🇵🇦","Bélgica":"🇧🇪",
  "Marrocos":"🇲🇦","Japão":"🇯🇵","Holanda":"🇳🇱","Croácia":"🇭🇷","Austrália":"🇦🇺",
  "Noruega":"🇳🇴","Sérvia":"🇷🇸","Arábia Saudita":"🇸🇦","Senegal":"🇸🇳","Angola":"🇦🇴",
  "Tunísia":"🇹🇳","Dinamarca":"🇩🇰","Coreia do Sul":"🇰🇷","Suíça":"🇨🇭","Eslováquia":"🇸🇰",
  "Ucrânia":"🇺🇦","Argélia":"🇩🇿","África do Sul":"🇿🇦","Tchéquia":"🇨🇿",
  "Bósnia-Herzegovina":"🇧🇦","Catar":"🇶🇦","Paraguai":"🇵🇾","Turquia":"🇹🇷",
  "Costa do Marfim":"🇨🇮","Curaçao":"🇨🇼","Suécia":"🇸🇪","Cabo Verde":"🇨🇻",
  "Egito":"🇪🇬","Irã":"🇮🇷","Nova Zelândia":"🇳🇿","Iraque":"🇮🇶","Jordânia":"🇯🇴",
  "Áustria":"🇦🇹","RD Congo":"🇨🇩","Uzbequistão":"🇺🇿","Gana":"🇬🇭","Haiti":"🇭🇹",
  "Escócia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
};
const flag = t => FLAGS[t] || "🏳️";

const fmtDate = iso => new Date(iso+":00-03:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(".","");
const fmtTime = iso => new Date(iso+":00-03:00").toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+"h";
const isPast  = iso => new Date(iso+":00-03:00") < new Date();
const isToday = iso => { const d=new Date(iso+":00-03:00"),n=new Date(); return d.toDateString()===n.toDateString(); };

function calcPoints(guess, result) {
  if (!guess||!result) return null;
  const gh=parseInt(guess.home),ga=parseInt(guess.away);
  const rh=parseInt(result.home),ra=parseInt(result.away);
  if(isNaN(gh)||isNaN(ga)||isNaN(rh)||isNaN(ra)) return null;
  if(gh===rh&&ga===ra) return 3;
  return (gh>ga?"H":gh<ga?"A":"D")===(rh>ra?"H":rh<ra?"A":"D") ? 1 : 0;
}

const AVATAR_COLORS = ["#009c3b","#002776","#c8a200","#8b1010","#005580","#4a0080","#803000","#008080","#006060","#505000"];
const avatarColor = name => AVATAR_COLORS[(name?.charCodeAt(0)||0) % AVATAR_COLORS.length];
const safeKey = s => s?.replace(/[.#$[\]/\s]/g,"_") || "";

const TABS_BOLAO = ["📅 Hoje","🗓️ Agenda","🏆 Meus Palpites","👀 Palpites de Todos","📊 Ranking","⚙️ Admin"];
const PHASE_LABEL = {"32avos":"32 AVOS","Oitavas":"OITAVAS","Quartas":"QUARTAS","Semifinal":"SEMIFINAIS","3º Lugar":"3º LUGAR","Final":"🏆 FINAL"};

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [db, setDb] = useState(null);

  // Navegação global
  const [screen, setScreen] = useState("home"); // home | register | pending | bolao
  const [selectedBolao, setSelectedBolao] = useState(null); // { id, nome, descricao }
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bg26_session")||"null"); } catch { return null; }
  }); // { uid, apelido, bolaoId }

  // Dados Firebase
  const [boloes, setBoloes]         = useState({});
  const [allGuesses, setAllGuesses] = useState({});
  const [results, setResults]       = useState({});
  const [members, setMembers]       = useState({}); // por bolão

  // UI bolão
  const [tab, setTab]               = useState(0);
  const [filterGroup, setFilterGroup] = useState("Todos");
  const [notification, setNotification] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [apiKey, setApiKey]         = useState(localStorage.getItem("bg26_apikey")||"");
  const [liveFetching, setLiveFetching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Formulários
  const [regNome, setRegNome]       = useState("");
  const [regApelido, setRegApelido] = useState("");
  const [regWa, setRegWa]           = useState("");
  const [regError, setRegError]     = useState("");
  const [newBolaoNome, setNewBolaoNome] = useState("");
  const [newBolaoDesc, setNewBolaoDesc] = useState("");

  const notify = (msg, type="ok") => { setNotification({msg,type}); setTimeout(()=>setNotification(null),3500); };

  // ── Init Firebase ───────────────────────────────────────────────────────────
  useEffect(() => {
    const app = initializeApp(FIREBASE_CONFIG);
    setDb(getDatabase(app));
  }, []);

  // ── Listeners globais ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const rBoloes = dbRef(db, "boloes");
    const rResults = dbRef(db, "results");
    const rGuesses = dbRef(db, "guesses");
    const rMembers = dbRef(db, "members");
    onValue(rBoloes,  s => setBoloes(s.val()||{}));
    onValue(rResults, s => setResults(s.val()||{}));
    onValue(rGuesses, s => setAllGuesses(s.val()||{}));
    onValue(rMembers, s => setMembers(s.val()||{}));
    return () => { off(rBoloes); off(rResults); off(rGuesses); off(rMembers); };
  }, [db]);

  // ── Persist session ─────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("bg26_session", JSON.stringify(currentUser));
  }, [currentUser]);

  // ── Retomar sessão ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser && boloes[currentUser.bolaoId]) {
      setSelectedBolao({ id: currentUser.bolaoId, ...boloes[currentUser.bolaoId] });
      setScreen("bolao");
    }
  }, [db, boloes]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getResult = id => results[id];
  const getGuessOf = (uid, id) => allGuesses[safeKey(uid)]?.[id];
  const myGuesses = allGuesses[safeKey(currentUser?.uid)] || {};

  function getMembersOfBolao(bolaoId) {
    return Object.entries(members[bolaoId] || {}).map(([uid, data]) => ({ uid, ...data }));
  }
  function getApprovedMembers(bolaoId) {
    return getMembersOfBolao(bolaoId).filter(m => m.status === "aprovado");
  }
  function getPendingMembers(bolaoId) {
    return getMembersOfBolao(bolaoId).filter(m => m.status === "pendente");
  }

  // ── Cadastro ────────────────────────────────────────────────────────────────
  async function handleRegister() {
    setRegError("");
    if (!regNome.trim()) { setRegError("Digite seu nome completo."); return; }
    if (!regApelido.trim()) { setRegError("Escolha um apelido."); return; }
    if (!regWa.trim() || regWa.replace(/\D/g,"").length < 10) { setRegError("Digite um WhatsApp válido com DDD."); return; }
    if (!selectedBolao) { setRegError("Selecione um bolão primeiro."); return; }

    const uid = safeKey(regApelido.trim());
    const existing = members[selectedBolao.id]?.[uid];
    if (existing) { setRegError("Este apelido já está em uso neste bolão. Escolha outro."); return; }

    try {
      await set(dbRef(db, `members/${selectedBolao.id}/${uid}`), {
        nome: regNome.trim(),
        apelido: regApelido.trim(),
        whatsapp: regWa.trim(),
        status: "pendente",
        createdAt: new Date().toISOString(),
      });
      setScreen("pending");
    } catch { setRegError("Erro ao enviar cadastro. Tente novamente."); }
  }

  // ── Login (apelido já aprovado) ─────────────────────────────────────────────
  async function handleLogin(uid, apelido) {
    const member = members[selectedBolao.id]?.[uid];
    if (!member) { notify("Apelido não encontrado neste bolão.","err"); return; }
    if (member.status === "pendente") { setScreen("pending"); return; }
    if (member.status === "rejeitado") { notify("Seu cadastro foi recusado. Entre em contato com o administrador.","err"); return; }
    setCurrentUser({ uid, apelido: member.apelido, bolaoId: selectedBolao.id });
    setScreen("bolao");
    notify(`⚽ Bem-vindo(a) ao ${selectedBolao.nome}, ${member.apelido}!`);
  }

  // ── Admin: aprovar/rejeitar ─────────────────────────────────────────────────
  async function approveMember(bolaoId, uid) {
    await update(dbRef(db, `members/${bolaoId}/${uid}`), { status: "aprovado" });
    notify(`✅ ${uid} aprovado!`);
  }
  async function rejectMember(bolaoId, uid) {
    await update(dbRef(db, `members/${bolaoId}/${uid}`), { status: "rejeitado" });
    notify(`❌ ${uid} rejeitado.`,"err");
  }
  async function removeMember(bolaoId, uid) {
    await remove(dbRef(db, `members/${bolaoId}/${uid}`));
    notify("Participante removido.");
  }

  // ── Admin: criar bolão ──────────────────────────────────────────────────────
  async function createBolao() {
    if (!newBolaoNome.trim()) { notify("Digite o nome do bolão.","err"); return; }
    const id = safeKey(newBolaoNome.trim()) + "_" + Date.now();
    await set(dbRef(db, `boloes/${id}`), {
      nome: newBolaoNome.trim(),
      descricao: newBolaoDesc.trim() || "Copa do Mundo 2026",
      ativo: true,
      criadoEm: new Date().toISOString(),
    });
    setNewBolaoNome(""); setNewBolaoDesc("");
    notify(`🏆 Bolão "${newBolaoNome}" criado!`);
  }

  // ── Palpites e resultados ────────────────────────────────────────────────────
  async function saveGuess(gameId, side, val) {
    if (!currentUser || !db) return;
    await set(dbRef(db, `guesses/${safeKey(currentUser.uid)}/${gameId}/${side}`), val);
  }
  async function saveResult(gameId, side, val) {
    if (!db) return;
    await set(dbRef(db, `results/${gameId}/${side}`), val);
  }

  // ── Busca automática ─────────────────────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    setLiveFetching(true);
    try {
      if (!apiKey) { notify("⚠️ Configure a chave de API no Admin","warn"); setLiveFetching(false); return; }
      const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED&season=2026",
        { headers: {"X-Auth-Token": apiKey} });
      if (!res.ok) throw new Error();
      const data = await res.json();
      for (const m of (data.matches||[])) {
        const hn = (m.homeTeam?.shortName||"").toLowerCase().slice(0,4);
        const found = SCHEDULE.find(s => s.home.toLowerCase().startsWith(hn));
        if (found && m.score?.fullTime?.home != null)
          await set(dbRef(db, `results/${found.id}`), {home:String(m.score.fullTime.home),away:String(m.score.fullTime.away)});
      }
      const t = new Date().toLocaleTimeString("pt-BR");
      setLastUpdate(t); localStorage.setItem("bg26_lu",t);
      notify("✅ Resultados atualizados!");
    } catch { notify("❌ Erro na API.","err"); }
    setLiveFetching(false);
  }, [db, apiKey]);

  // ── Ranking do bolão atual ───────────────────────────────────────────────────
  function getRanking() {
    if (!selectedBolao) return [];
    return getApprovedMembers(selectedBolao.id).map(m => {
      let pts=0,exact=0,win=0;
      SCHEDULE.filter(g=>!g.knockout).forEach(g=>{
        const r=getResult(g.id), gu=getGuessOf(m.uid,g.id);
        if(r&&gu){const pt=calcPoints(gu,r);if(pt!=null){pts+=pt;if(pt===3)exact++;if(pt===1)win++;}}
      });
      return {...m,pts,exact,win};
    }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact||b.win-a.win);
  }

  const GROUPS = [...new Set(SCHEDULE.filter(g=>!g.knockout).map(g=>g.group))].sort();
  const FILTER_OPTS = ["Todos","Hoje",...GROUPS.map(g=>"Grupo "+g),"32 Avos","Oitavas","Quartas","Semifinal","3º Lugar","Final"];
  function filteredGames() {
    return SCHEDULE.filter(g => {
      if(filterGroup==="Todos") return true;
      if(filterGroup==="Hoje") return isToday(g.date);
      if(filterGroup==="32 Avos") return g.group==="32avos";
      if(filterGroup==="Oitavas") return g.group==="Oitavas";
      if(filterGroup==="Quartas") return g.group==="Quartas";
      if(filterGroup==="Semifinal") return g.group==="Semifinal";
      if(filterGroup==="3º Lugar") return g.group==="3º Lugar";
      if(filterGroup==="Final") return g.group==="Final";
      return "Grupo "+g.group===filterGroup;
    });
  }

  const ranking = getRanking();
  const leader  = ranking[0];
  const myRank  = ranking.findIndex(r=>r.uid===currentUser?.uid)+1;
  const myPts   = ranking.find(r=>r.uid===currentUser?.uid)?.pts||0;
  const todayGames = SCHEDULE.filter(g=>isToday(g.date));

  // ── Estilos base ─────────────────────────────────────────────────────────────
  const BASE = {
    minHeight:"100vh",
    background:"radial-gradient(ellipse at 30% 0%,#003d1a 0%,#001a0a 40%,#050d1a 70%,#000509 100%)",
    fontFamily:"'Bebas Neue',Impact,sans-serif",color:"#fff"
  };

  // ────────────────────────────────────────────────────────────────────────────
  // HEADER reutilizável
  const Header = ({sub=""}) => (
    <header>
      <div style={{background:"linear-gradient(135deg,#004d22,#009c3b 25%,#002776 60%,#001240)"}}>
        <div style={{background:"rgba(0,0,0,.55)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{cursor:"pointer"}} onClick={()=>{setScreen("home");setSelectedBolao(null);setCurrentUser(null);localStorage.removeItem("bg26_session");}}>
            <div style={{fontSize:34,letterSpacing:7,lineHeight:1,textShadow:"0 0 30px rgba(255,223,0,.35)"}}>⚽ BOLÃO DO GESTOR</div>
            <div style={{fontSize:11,letterSpacing:4,color:"#ffdf00",fontFamily:"sans-serif",fontWeight:300}}>By Prof. Isaac Martins · 🇧🇷 Brasil Rumo ao Hexa 🏆</div>
            {sub&&<div style={{fontSize:12,color:"#aaa",letterSpacing:2,marginTop:2}}>{sub}</div>}
          </div>
          {currentUser&&<div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#888",fontFamily:"sans-serif"}}>VOCÊ</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:avatarColor(currentUser.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>{currentUser.apelido[0].toUpperCase()}</div>
              <div>
                <div style={{fontSize:16,color:"#ffdf00"}}>{currentUser.apelido}</div>
                <div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>{myRank>0?`${myRank}º · ${myPts} pts`:"0 pts"}</div>
              </div>
            </div>
            <button onClick={()=>{setCurrentUser(null);setScreen("home");setSelectedBolao(null);localStorage.removeItem("bg26_session");}}
              style={{background:"transparent",border:"1px solid #333",color:"#666",borderRadius:5,padding:"3px 10px",cursor:"pointer",fontSize:10,fontFamily:"sans-serif",marginTop:4}}>Sair</button>
          </div>}
        </div>
      </div>
      <div style={{height:4,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
    </header>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TELA HOME — lista de bolões
  if (screen==="home") {
    const bList = Object.entries(boloes).filter(([,b])=>b.ativo);
    return (
      <div style={BASE}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}input,select,button{font-family:inherit;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:linear-gradient(#009c3b,#002776);border-radius:3px;}@keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.hv:hover{border-color:#ffdf00!important;transform:translateY(-2px);}`}</style>
        <Header/>
        {notification&&<div style={{position:"fixed",top:80,right:16,zIndex:999,animation:"pop .3s ease",background:notification.type==="err"?"#7a1010":notification.type==="warn"?"#7a5000":"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,.7)"}}>{notification.msg}</div>}

        <div style={{maxWidth:700,margin:"0 auto",padding:"32px 16px"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:32,letterSpacing:5,color:"#ffdf00",marginBottom:8}}>ESCOLHA SEU BOLÃO</div>
            <div style={{fontFamily:"sans-serif",fontSize:14,color:"#888"}}>Clique no bolão que você está participando</div>
          </div>

          {bList.length===0?(
            <div style={{textAlign:"center",padding:"40px",fontFamily:"sans-serif",color:"#555"}}>
              <div style={{fontSize:40,marginBottom:12}}>🏆</div>
              <div style={{fontSize:16,color:"#777"}}>Nenhum bolão disponível ainda</div>
              <div style={{fontSize:13,marginTop:6}}>O administrador ainda não criou nenhum bolão</div>
            </div>
          ):(
            <div style={{display:"grid",gap:14}}>
              {bList.map(([id,b])=>{
                const approved = getApprovedMembers(id).length;
                const pending  = getPendingMembers(id).length;
                return (
                  <div key={id} className="hv" onClick={()=>{setSelectedBolao({id,...b});setScreen("login_"+id);}}
                    style={{background:"rgba(255,255,255,.04)",border:"1px solid #1a3a1a",borderRadius:14,padding:"20px 24px",cursor:"pointer",transition:".2s",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                    <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#009c3b,#002776)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>⚽</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:24,letterSpacing:3,color:"#ffdf00"}}>{b.nome}</div>
                      <div style={{fontFamily:"sans-serif",fontSize:13,color:"#aaa",marginTop:2}}>{b.descricao}</div>
                      <div style={{fontFamily:"sans-serif",fontSize:11,color:"#555",marginTop:4}}>👥 {approved} participante{approved!==1?"s":""} {pending>0&&<span style={{color:"#ffdf00"}}>· {pending} aguardando aprovação</span>}</div>
                    </div>
                    <div style={{color:"#009c3b",fontSize:22}}>▶</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Acesso admin discreto */}
          <div style={{marginTop:40,textAlign:"center"}}>
            <button onClick={()=>setScreen("admin_global")}
              style={{background:"transparent",border:"1px solid #1a1a1a",color:"#333",borderRadius:6,padding:"6px 16px",cursor:"pointer",fontSize:11,fontFamily:"sans-serif"}}>
              ⚙️ Administrador
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA ADMIN GLOBAL — criar bolões, aprovar membros
  if (screen==="admin_global") {
    return (
      <div style={BASE}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}input,select,button{font-family:inherit;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:#009c3b;border-radius:3px;}@keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <Header sub="PAINEL DO ADMINISTRADOR"/>
        {notification&&<div style={{position:"fixed",top:80,right:16,zIndex:999,animation:"pop .3s ease",background:notification.type==="err"?"#7a1010":"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13}}>{notification.msg}</div>}

        <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
          {!adminUnlocked?(
            <div style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.3)",borderRadius:12,padding:"24px",maxWidth:400,margin:"60px auto",textAlign:"center"}}>
              <div style={{fontSize:22,letterSpacing:3,color:"#ffdf00",marginBottom:16}}>🔐 ACESSO RESTRITO</div>
              <input type="password" placeholder="Senha do administrador" value={adminInput} onChange={e=>setAdminInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&(adminInput===ADMIN_PASS?setAdminUnlocked(true):notify("Senha incorreta","err"))}
                style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"10px 14px",fontSize:14,fontFamily:"sans-serif",marginBottom:10}}/>
              <button onClick={()=>adminInput===ADMIN_PASS?setAdminUnlocked(true):notify("Senha incorreta","err")}
                style={{width:"100%",background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:16,cursor:"pointer",letterSpacing:2}}>ENTRAR</button>
              <button onClick={()=>setScreen("home")} style={{marginTop:10,background:"transparent",color:"#666",border:"none",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>← Voltar</button>
            </div>
          ):(
            <>
              <button onClick={()=>setScreen("home")} style={{background:"transparent",color:"#888",border:"1px solid #333",borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",marginBottom:20}}>← Voltar para os bolões</button>

              {/* Criar novo bolão */}
              <div style={{background:"rgba(0,156,59,.07)",border:"1px solid rgba(0,156,59,.3)",borderRadius:12,padding:"20px",marginBottom:24}}>
                <div style={{fontSize:20,letterSpacing:3,color:"#009c3b",marginBottom:14}}>➕ CRIAR NOVO BOLÃO</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <input placeholder="Nome do bolão (ex: Bolão da Família)" value={newBolaoNome} onChange={e=>setNewBolaoNome(e.target.value)}
                    style={{flex:1,minWidth:200,background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:"sans-serif"}}/>
                  <input placeholder="Descrição (opcional)" value={newBolaoDesc} onChange={e=>setNewBolaoDesc(e.target.value)}
                    style={{flex:1,minWidth:200,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:"sans-serif"}}/>
                  <button onClick={createBolao} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:14,fontWeight:700}}>Criar</button>
                </div>
              </div>

              {/* Lista de bolões e membros pendentes */}
              {Object.entries(boloes).map(([bid,b])=>{
                const pending  = getPendingMembers(bid);
                const approved = getApprovedMembers(bid);
                const rejected = getMembersOfBolao(bid).filter(m=>m.status==="rejeitado");
                return (
                  <div key={bid} style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a2a1a",borderRadius:12,marginBottom:16,overflow:"hidden"}}>
                    <div style={{background:"linear-gradient(90deg,#004d22,#009c3b)",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <div>
                        <span style={{fontSize:18,letterSpacing:3}}>{b.nome}</span>
                        <span style={{fontFamily:"sans-serif",fontSize:12,color:"rgba(255,255,255,.6)",marginLeft:10}}>{b.descricao}</span>
                      </div>
                      <div style={{fontFamily:"sans-serif",fontSize:12,color:"rgba(255,255,255,.7)"}}>
                        ✅ {approved.length} aprovados · ⏳ {pending.length} pendentes · ❌ {rejected.length} rejeitados
                      </div>
                    </div>
                    <div style={{padding:"14px 18px"}}>
                      {pending.length>0&&(
                        <>
                          <div style={{fontSize:13,color:"#ffdf00",letterSpacing:2,marginBottom:10}}>⏳ AGUARDANDO APROVAÇÃO</div>
                          <div style={{display:"grid",gap:8,marginBottom:16}}>
                            {pending.map(m=>(
                              <div key={m.uid} style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.2)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                                <div style={{width:36,height:36,borderRadius:"50%",background:avatarColor(m.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",flexShrink:0}}>{m.apelido[0].toUpperCase()}</div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:16,letterSpacing:1}}>{m.apelido}</div>
                                  <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>
                                    👤 {m.nome} · 📱 <a href={`https://wa.me/55${m.whatsapp?.replace(/\D/g,"")}`} target="_blank" style={{color:"#25d366",textDecoration:"none"}}>{m.whatsapp}</a>
                                  </div>
                                  <div style={{fontFamily:"sans-serif",fontSize:10,color:"#555"}}>Cadastrado em {new Date(m.createdAt).toLocaleDateString("pt-BR")}</div>
                                </div>
                                <div style={{display:"flex",gap:8}}>
                                  <button onClick={()=>approveMember(bid,m.uid)} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>✅ Aprovar</button>
                                  <button onClick={()=>rejectMember(bid,m.uid)} style={{background:"#7a1010",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>❌ Rejeitar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {approved.length>0&&(
                        <>
                          <div style={{fontSize:13,color:"#009c3b",letterSpacing:2,marginBottom:8}}>✅ APROVADOS ({approved.length})</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                            {approved.map(m=>(
                              <div key={m.uid} style={{background:"rgba(0,156,59,.08)",border:"1px solid rgba(0,156,59,.2)",borderRadius:20,padding:"5px 14px",display:"flex",alignItems:"center",gap:8}}>
                                <span style={{width:22,height:22,borderRadius:"50%",background:avatarColor(m.apelido),display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{m.apelido[0].toUpperCase()}</span>
                                <span style={{fontFamily:"sans-serif",fontSize:13}}>{m.apelido}</span>
                                <button onClick={()=>removeMember(bid,m.uid)} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontSize:14,padding:"0 2px"}}>×</button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Resultados + API */}
                      <div style={{borderTop:"1px solid #1a1a1a",paddingTop:12,marginTop:4}}>
                        <div style={{fontSize:13,color:"#888",letterSpacing:2,marginBottom:8}}>🌐 API DE RESULTADOS AUTOMÁTICOS</div>
                        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                          <input type="text" placeholder="Chave football-data.org" value={apiKey}
                            onChange={e=>{setApiKey(e.target.value);localStorage.setItem("bg26_apikey",e.target.value);}}
                            style={{flex:1,minWidth:180,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:6,padding:"7px 12px",fontSize:12,fontFamily:"monospace"}}/>
                          <button onClick={fetchLive} disabled={liveFetching} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:12,fontWeight:700}}>
                            {liveFetching?"⏳":"🔄"} Atualizar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA LOGIN / CADASTRO de um bolão específico
  if (screen.startsWith("login_") && selectedBolao) {
    const approved = getApprovedMembers(selectedBolao.id);
    const [loginApelido, setLoginApelido] = useState("");
    const [loginError, setLoginError]     = useState("");
    const [showReg, setShowReg]           = useState(false);

    return (
      <div style={BASE}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}input,select,button{font-family:inherit;}@keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.hv2:hover{background:rgba(0,156,59,.15)!important;border-color:#009c3b!important;}`}</style>
        <Header sub={selectedBolao.nome.toUpperCase()}/>
        {notification&&<div style={{position:"fixed",top:80,right:16,zIndex:999,animation:"pop .3s ease",background:notification.type==="err"?"#7a1010":"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13}}>{notification.msg}</div>}

        <div style={{maxWidth:440,margin:"0 auto",padding:"32px 16px"}}>
          <button onClick={()=>{setScreen("home");setSelectedBolao(null);}} style={{background:"transparent",color:"#777",border:"none",cursor:"pointer",fontSize:13,fontFamily:"sans-serif",marginBottom:20}}>← Voltar</button>

          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:28,letterSpacing:4,color:"#ffdf00"}}>{selectedBolao.nome}</div>
            <div style={{fontFamily:"sans-serif",fontSize:13,color:"#777"}}>{selectedBolao.descricao}</div>
          </div>

          {!showReg ? (
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,223,0,.2)",borderRadius:14,padding:"24px"}}>
              <div style={{fontSize:18,letterSpacing:3,color:"#ffdf00",marginBottom:14}}>QUEM É VOCÊ?</div>

              {approved.length>0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#666",letterSpacing:1,marginBottom:8}}>PARTICIPANTES DESTE BOLÃO:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {approved.map(m=>(
                      <button key={m.uid} className="hv2" onClick={()=>setLoginApelido(m.apelido)}
                        style={{background:loginApelido===m.apelido?"rgba(0,156,59,.2)":"rgba(255,255,255,.05)",
                          border:`1px solid ${loginApelido===m.apelido?"#009c3b":"#2a2a2a"}`,
                          color:loginApelido===m.apelido?"#fff":"#ccc",borderRadius:20,
                          padding:"6px 14px",cursor:"pointer",fontSize:13,transition:".2s",
                          display:"flex",alignItems:"center",gap:6}}>
                        <span style={{width:22,height:22,borderRadius:"50%",background:avatarColor(m.apelido),display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{m.apelido[0].toUpperCase()}</span>
                        {m.apelido}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input type="text" placeholder="Digite seu apelido" value={loginApelido}
                onChange={e=>{setLoginApelido(e.target.value);setLoginError("");}}
                onKeyDown={e=>{ if(e.key==="Enter"){ const m=approved.find(x=>x.apelido.toLowerCase()===loginApelido.toLowerCase()); if(m)handleLogin(m.uid,m.apelido); else setLoginError("Apelido não encontrado."); }}}
                style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"10px 14px",fontSize:15,marginBottom:8,outline:"none",fontFamily:"sans-serif"}}/>
              {loginError&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:8}}>{loginError}</div>}

              <button onClick={()=>{
                const m=approved.find(x=>x.apelido.toLowerCase()===loginApelido.toLowerCase());
                if(m) handleLogin(m.uid,m.apelido);
                else setLoginError("Apelido não encontrado neste bolão.");
              }} style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:16,letterSpacing:2,cursor:"pointer",marginBottom:10}}>
                ENTRAR ⚽
              </button>

              <button onClick={()=>setShowReg(true)}
                style={{width:"100%",background:"transparent",color:"#ffdf00",border:"1px solid rgba(255,223,0,.3)",borderRadius:8,padding:"10px",fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>
                ➕ Ainda não estou cadastrado — quero participar!
              </button>
            </div>
          ) : (
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,223,0,.3)",borderRadius:14,padding:"24px"}}>
              <div style={{fontSize:18,letterSpacing:3,color:"#ffdf00",marginBottom:6}}>SOLICITAR PARTICIPAÇÃO</div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:16}}>Preencha os dados abaixo. O administrador irá aprovar seu acesso.</div>

              {[
                {label:"Seu nome completo *",val:regNome,set:setRegNome,ph:"Ex: Maria Silva"},
                {label:"Apelido no bolão *",val:regApelido,set:setRegApelido,ph:"Ex: Mari, Maju, Silva..."},
                {label:"WhatsApp com DDD *",val:regWa,set:setRegWa,ph:"Ex: 11987654321"},
              ].map(f=>(
                <div key={f.label} style={{marginBottom:12}}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",marginBottom:4,letterSpacing:1}}>{f.label}</div>
                  <input type="text" placeholder={f.ph} value={f.val} onChange={e=>{f.set(e.target.value);setRegError("");}}
                    style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",borderRadius:8,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"sans-serif"}}/>
                </div>
              ))}
              {regError&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:10}}>{regError}</div>}

              <button onClick={handleRegister}
                style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:16,letterSpacing:2,cursor:"pointer",marginBottom:10}}>
                SOLICITAR PARTICIPAÇÃO 📝
              </button>
              <button onClick={()=>{setShowReg(false);setRegError("");}}
                style={{width:"100%",background:"transparent",color:"#666",border:"1px solid #333",borderRadius:8,padding:"9px",fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>
                ← Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA PENDENTE
  if (screen==="pending") {
    return (
      <div style={BASE}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}`}</style>
        <Header/>
        <div style={{maxWidth:440,margin:"60px auto",padding:"0 16px",textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:16}}>⏳</div>
          <div style={{fontSize:26,letterSpacing:4,color:"#ffdf00",marginBottom:10}}>CADASTRO ENVIADO!</div>
          <div style={{fontFamily:"sans-serif",fontSize:14,color:"#aaa",lineHeight:1.8,marginBottom:20}}>
            Seu cadastro foi enviado para o administrador.<br/>
            Assim que for aprovado, você já pode entrar no bolão.<br/><br/>
            <strong style={{color:"#fff"}}>Dica:</strong> Avise o Prof. Isaac pelo WhatsApp que você se cadastrou!
          </div>
          <button onClick={()=>{setScreen("home");setSelectedBolao(null);}}
            style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"12px 24px",fontSize:16,letterSpacing:2,cursor:"pointer"}}>
            ← VOLTAR AO INÍCIO
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA PRINCIPAL DO BOLÃO
  if (screen==="bolao" && currentUser && selectedBolao) {
    const approvedMembers = getApprovedMembers(selectedBolao.id);

    const GameRow = ({g, mode="agenda"}) => {
      const r=getResult(g.id), gu=myGuesses[g.id];
      const pts=r&&gu?calcPoints(gu,r):null;
      const past=isPast(g.date), today=isToday(g.date), hasR=r&&r.home!==undefined&&r.home!=="";
      const locked=past&&!adminUnlocked;
      const border=hasR?"#009c3b":today?"#ffdf00":"#1a2e1a";
      const bg=hasR?"rgba(0,156,59,.07)":today?"rgba(255,223,0,.05)":"rgba(255,255,255,.02)";
      return (
        <div style={{background:bg,border:`1px solid ${border}`,borderRadius:12,overflow:"hidden",marginBottom:8}}>
          <div style={{background:today?"rgba(255,223,0,.12)":"rgba(255,255,255,.04)",borderBottom:`1px solid ${border}`,padding:"6px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {today&&<span style={{background:"#cc0000",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,letterSpacing:1}}>🔴 HOJE</span>}
              <span style={{fontSize:13,color:"#ffdf00",fontWeight:700,letterSpacing:1}}>{fmtDate(g.date)}</span>
              <span style={{fontSize:20,color:"#fff",fontWeight:900,letterSpacing:2}}>{fmtTime(g.date)}</span>
              <span style={{fontSize:10,color:"#666"}}>BRT · 📍{g.city}</span>
            </div>
            <span style={{background:g.knockout?"#3a0050":"#002776",color:g.knockout?"#ddaaff":"#aaa",fontSize:9,padding:"2px 7px",borderRadius:20}}>
              {g.knockout?(PHASE_LABEL[g.group]||g.group):`GR.${g.group}`}
            </span>
          </div>
          <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"center",flexWrap:"wrap",minWidth:200}}>
              <span style={{fontSize:20}}>{flag(g.home)}</span><span style={{fontSize:13}}>{g.home}</span>
              {mode==="meus"?(<>
                <input type="number" min="0" max="20" value={gu?.home??""} disabled={locked} onChange={e=>saveGuess(g.id,"home",e.target.value)} placeholder="–"
                  style={{width:44,textAlign:"center",background:"#060f06",color:"#fff",border:`2px solid ${locked?"#2a2a2a":"#009c3b"}`,borderRadius:6,padding:"5px 2px",fontSize:20,fontFamily:"monospace",opacity:locked?.55:1}}/>
                <span style={{color:"#ffdf00",fontSize:20,fontWeight:900}}>×</span>
                <input type="number" min="0" max="20" value={gu?.away??""} disabled={locked} onChange={e=>saveGuess(g.id,"away",e.target.value)} placeholder="–"
                  style={{width:44,textAlign:"center",background:"#060f06",color:"#fff",border:`2px solid ${locked?"#2a2a2a":"#009c3b"}`,borderRadius:6,padding:"5px 2px",fontSize:20,fontFamily:"monospace",opacity:locked?.55:1}}/>
              </>):mode==="admin"?(<>
                <input type="number" min="0" max="20" value={r?.home??""} onChange={e=>saveResult(g.id,"home",e.target.value)} placeholder="–"
                  style={{width:44,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:6,padding:"5px 2px",fontSize:20,fontFamily:"monospace"}}/>
                <span style={{color:"#fff",fontSize:20,fontWeight:900}}>×</span>
                <input type="number" min="0" max="20" value={r?.away??""} onChange={e=>saveResult(g.id,"away",e.target.value)} placeholder="–"
                  style={{width:44,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:6,padding:"5px 2px",fontSize:20,fontFamily:"monospace"}}/>
              </>):(
                hasR?<span style={{fontSize:26,letterSpacing:4,color:"#ffdf00",fontWeight:900,minWidth:80,textAlign:"center"}}>{r.home}×{r.away}</span>
                    :<span style={{fontSize:22,color:"#2a2a2a",minWidth:60,textAlign:"center"}}>×</span>
              )}
              <span style={{fontSize:13}}>{g.away}</span><span style={{fontSize:20}}>{flag(g.away)}</span>
            </div>
            {mode==="meus"&&hasR&&gu&&(
              <div style={{minWidth:64,textAlign:"center"}}>
                {pts===3&&<span style={{background:"#009c3b",color:"#fff",padding:"4px 10px",borderRadius:6,fontFamily:"sans-serif",fontSize:12,fontWeight:700,display:"block"}}>✓ 3 pts</span>}
                {pts===1&&<span style={{background:"#c8a200",color:"#fff",padding:"4px 10px",borderRadius:6,fontFamily:"sans-serif",fontSize:12,fontWeight:700,display:"block"}}>〜 1 pt</span>}
                {pts===0&&<span style={{background:"#5a1010",color:"#ffaaaa",padding:"4px 10px",borderRadius:6,fontFamily:"sans-serif",fontSize:11,fontWeight:700,display:"block"}}>✗ 0 pt</span>}
                <div style={{fontSize:10,color:"#555",fontFamily:"sans-serif",marginTop:2}}>[{r.home}×{r.away}]</div>
              </div>
            )}
            {mode==="agenda"&&<div style={{fontSize:11,fontFamily:"sans-serif",color:hasR?"#009c3b":past?"#555":"#ffdf00",minWidth:70,textAlign:"right"}}>{hasR?"✅ Final":past?"⏳ Aguardando":"🕐 Em breve"}</div>}
          </div>
        </div>
      );
    };

    return (
      <div style={BASE}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}input,select,button{font-family:inherit;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:linear-gradient(#009c3b,#002776);border-radius:3px;}@keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.tb:hover{background:rgba(255,223,0,.1)!important;color:#ffdf00!important;}input[type=number]::-webkit-inner-spin-button{opacity:.5;}input:focus{outline:none;}`}</style>
        <Header sub={selectedBolao.nome.toUpperCase()}/>
        {notification&&<div style={{position:"fixed",top:80,right:16,zIndex:999,animation:"pop .3s ease",background:notification.type==="err"?"#7a1010":notification.type==="warn"?"#7a5000":"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,.7)"}}>{notification.msg}</div>}

        {/* Barra status */}
        <div style={{background:"rgba(0,0,0,.8)",borderBottom:"1px solid #0a200a",padding:"6px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <button onClick={fetchLive} disabled={liveFetching} style={{background:liveFetching?"#1a1a1a":"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>
            {liveFetching?"⏳":"🔄"} Atualizar Placares
          </button>
          {lastUpdate&&<span style={{fontFamily:"sans-serif",fontSize:11,color:"#555"}}>🕐 {lastUpdate}</span>}
          <span style={{marginLeft:"auto",fontFamily:"sans-serif",fontSize:11,color:"#333"}}>{approvedMembers.length} participantes · ⚡ Auto 5min</span>
        </div>

        {/* Tabs */}
        <nav style={{background:"rgba(0,0,0,.8)",borderBottom:"2px solid rgba(255,223,0,.3)",display:"flex",overflowX:"auto"}}>
          {TABS_BOLAO.map((t,i)=>(
            <button key={i} className="tb" onClick={()=>setTab(i)} style={{background:tab===i?"rgba(255,223,0,.14)":"transparent",color:tab===i?"#ffdf00":"#888",border:"none",cursor:"pointer",padding:"12px 14px",fontSize:12,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap",transition:".2s",borderBottom:tab===i?"3px solid #ffdf00":"3px solid transparent"}}>{t}</button>
          ))}
        </nav>

        <main style={{maxWidth:1040,margin:"0 auto",padding:"18px 12px"}}>

          {/* TAB 0 - HOJE */}
          {tab===0&&(
            <div>
              <div style={{fontSize:24,letterSpacing:4,color:"#ffdf00",marginBottom:4}}>📅 JOGOS DE HOJE</div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:"#777",marginBottom:20}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
              {todayGames.length===0?(
                <div style={{textAlign:"center",padding:"60px 20px",fontFamily:"sans-serif",color:"#555"}}>
                  <div style={{fontSize:52,marginBottom:12}}>⚽</div>
                  <div style={{fontSize:18,color:"#777"}}>Nenhum jogo hoje</div>
                </div>
              ):(
                <>
                  {todayGames.sort((a,b)=>a.date.localeCompare(b.date)).map(g=><GameRow key={g.id} g={g}/>)}
                  <div style={{background:"rgba(255,223,0,.05)",border:"1px solid rgba(255,223,0,.15)",borderRadius:12,padding:"16px 18px",marginTop:16}}>
                    <div style={{fontSize:16,letterSpacing:3,color:"#ffdf00",marginBottom:12}}>👀 PALPITES DE TODOS HOJE</div>
                    {todayGames.map(g=>{
                      const r=getResult(g.id);
                      return(
                        <div key={g.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a2a1a",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:8}}>{flag(g.home)} {g.home} × {g.away} {flag(g.away)}{r?.home!==undefined&&<span style={{color:"#009c3b",marginLeft:8}}>→ {r.home}×{r.away}</span>}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                            {approvedMembers.map(m=>{
                              const gu=getGuessOf(m.uid,g.id);
                              const pts=r&&gu?calcPoints(gu,r):null;
                              const isMe=m.uid===currentUser.uid;
                              return(
                                <div key={m.uid} style={{background:pts===3?"rgba(0,156,59,.2)":pts===1?"rgba(200,162,0,.2)":pts===0?"rgba(90,16,16,.2)":"rgba(255,255,255,.04)",border:`1px solid ${pts===3?"#009c3b":pts===1?"#c8a200":pts===0?"#5a1010":isMe?"#ffdf00":"#2a2a2a"}`,borderRadius:8,padding:"6px 12px"}}>
                                  <div style={{fontFamily:"sans-serif",fontSize:11,color:isMe?"#ffdf00":"#aaa",fontWeight:isMe?700:400}}>{m.apelido}{isMe?" ★":""}</div>
                                  <div style={{fontFamily:"monospace",fontSize:16,fontWeight:700}}>{gu?.home!==undefined?`${gu.home}×${gu.away}`:"—"}{pts===3?" 🎯":pts===1?" ✅":pts===0?" ❌":""}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 1 - AGENDA */}
          {tab===1&&(
            <div>
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)} style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",padding:"8px 12px",borderRadius:6,fontSize:13,fontFamily:"sans-serif",cursor:"pointer"}}>
                  {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
                <span style={{fontFamily:"sans-serif",fontSize:12,color:"#555"}}>{filteredGames().length} jogos</span>
              </div>
              {filteredGames().map(g=><GameRow key={g.id} g={g}/>)}
            </div>
          )}

          {/* TAB 2 - MEUS PALPITES */}
          {tab===2&&(
            <div>
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:avatarColor(currentUser.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>{currentUser.apelido[0].toUpperCase()}</div>
                  <span style={{fontSize:18,letterSpacing:2,color:"#ffdf00"}}>{currentUser.apelido}</span>
                </div>
                <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)} style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",padding:"7px 10px",borderRadius:6,fontSize:12,fontFamily:"sans-serif",cursor:"pointer"}}>
                  {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              {filteredGames().map(g=><GameRow key={g.id} g={g} mode="meus"/>)}
              <p style={{textAlign:"center",marginTop:14,fontFamily:"sans-serif",fontSize:11,color:"#444"}}>💾 Sincronizado em tempo real · 🔒 Bloqueados após início</p>
            </div>
          )}

          {/* TAB 3 - PALPITES DE TODOS */}
          {tab===3&&(
            <div>
              <div style={{fontSize:20,letterSpacing:4,color:"#ffdf00",marginBottom:6}}>👀 PALPITES DE TODOS</div>
              <p style={{fontFamily:"sans-serif",fontSize:13,color:"#777",marginBottom:16}}>Palpites revelados após o início de cada jogo.</p>
              <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
                <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)} style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",padding:"7px 10px",borderRadius:6,fontSize:12,fontFamily:"sans-serif",cursor:"pointer"}}>
                  {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              {filteredGames().map(g=>{
                const r=getResult(g.id), past=isPast(g.date), hasR=r&&r.home!==undefined;
                return(
                  <div key={g.id} style={{background:"rgba(255,255,255,.02)",border:"1px solid #1a2a1a",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                    <div style={{background:"rgba(255,255,255,.05)",borderBottom:"1px solid #1a2a1a",padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:13,color:"#ffdf00",fontWeight:700}}>{fmtDate(g.date)}</span>
                        <span style={{fontSize:18,fontWeight:900}}>{fmtTime(g.date)}</span>
                      </div>
                      <div style={{fontFamily:"sans-serif",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:18}}>{flag(g.home)}</span><strong>{g.home}</strong>
                        {hasR?<span style={{color:"#ffdf00",fontSize:20,fontWeight:900,letterSpacing:3}}>{r.home}×{r.away}</span>:<span style={{color:"#333",fontSize:16}}>×</span>}
                        <strong>{g.away}</strong><span style={{fontSize:18}}>{flag(g.away)}</span>
                      </div>
                    </div>
                    <div style={{padding:"10px 14px"}}>
                      {!past?<div style={{fontFamily:"sans-serif",fontSize:12,color:"#555",textAlign:"center",padding:"8px"}}>🔒 Palpites revelados após o início</div>:(
                        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                          {approvedMembers.map(m=>{
                            const gu=getGuessOf(m.uid,g.id), pts=hasR&&gu?calcPoints(gu,r):null, isMe=m.uid===currentUser.uid;
                            return(
                              <div key={m.uid} style={{background:pts===3?"rgba(0,156,59,.18)":pts===1?"rgba(200,162,0,.15)":pts===0&&hasR?"rgba(90,16,16,.18)":"rgba(255,255,255,.04)",border:`1px solid ${pts===3?"#009c3b":pts===1?"#c8a200":pts===0&&hasR?"#5a1010":isMe?"rgba(255,223,0,.4)":"#2a2a2a"}`,borderRadius:10,padding:"8px 12px",minWidth:90}}>
                                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                                  <span style={{width:18,height:18,borderRadius:"50%",background:avatarColor(m.apelido),display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{m.apelido[0].toUpperCase()}</span>
                                  <span style={{fontFamily:"sans-serif",fontSize:10,color:isMe?"#ffdf00":"#aaa",fontWeight:isMe?700:400}}>{m.apelido}{isMe?" ★":""}</span>
                                </div>
                                <div style={{fontFamily:"monospace",fontSize:20,fontWeight:900,color:pts===3?"#009c3b":pts===1?"#c8a200":pts===0&&hasR?"#ff6b6b":"#fff",textAlign:"center"}}>{gu?.home!==undefined?`${gu.home}×${gu.away}`:"—"}</div>
                                {pts!==null&&<div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:10,color:pts===3?"#009c3b":pts===1?"#c8a200":"#ff6b6b",fontWeight:700}}>{pts===3?"🎯 3pts":pts===1?"✅ 1pt":"❌ 0pt"}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4 - RANKING */}
          {tab===4&&(
            <div>
              <h2 style={{letterSpacing:5,color:"#ffdf00",marginBottom:14,fontSize:24}}>🏆 RANKING — {selectedBolao.nome}</h2>
              <div style={{display:"grid",gap:8}}>
                {ranking.map((p,i)=>{
                  const isMe=p.uid===currentUser.uid;
                  return(
                    <div key={p.uid} style={{background:i===0?"linear-gradient(90deg,rgba(255,215,0,.16),transparent)":i===1?"linear-gradient(90deg,rgba(192,192,192,.08),transparent)":i===2?"linear-gradient(90deg,rgba(205,127,50,.08),transparent)":"rgba(255,255,255,.03)",border:`2px solid ${isMe?"#ffdf00":i===0?"rgba(255,215,0,.4)":"#1a1a1a"}`,borderRadius:10,padding:"13px 16px",display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:avatarColor(p.apelido),color:"#fff",fontSize:15,fontWeight:700}}>{p.apelido[0].toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:18,letterSpacing:2,color:isMe?"#ffdf00":"#fff"}}>{p.apelido}{isMe&&<span style={{fontSize:11,color:"#ffdf00",marginLeft:8,fontFamily:"sans-serif"}}>← você</span>}</div>
                        <div style={{fontSize:11,color:"#666",fontFamily:"sans-serif"}}>🎯 {p.exact} exatos · ✅ {p.win} acertos</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:i===0?"#ffdf00":i===1?"#aaa":i===2?"#cd7f32":"#1a2a1a",display:"flex",alignItems:"center",justifyContent:"center",color:i<3?"#000":"#777",fontSize:13,fontWeight:900}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:28,color:isMe?"#ffdf00":"#fff",lineHeight:1}}>{p.pts}</div>
                          <div style={{fontSize:10,color:"#555",fontFamily:"sans-serif"}}>PTS</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5 - ADMIN */}
          {tab===5&&(
            <div>
              <div style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.3)",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
                <div style={{fontSize:17,letterSpacing:3,color:"#ffdf00",marginBottom:10}}>🔐 MODO ADMIN</div>
                {!adminUnlocked?(
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                    <input type="password" placeholder="Senha do admin" value={adminInput} onChange={e=>setAdminInput(e.target.value)}
                      style={{background:"#050d0a",color:"#fff",border:"1px solid #444",borderRadius:5,padding:"7px 12px",fontSize:13,fontFamily:"sans-serif"}}/>
                    <button onClick={()=>adminInput===ADMIN_PASS?setAdminUnlocked(true):notify("Senha incorreta","err")}
                      style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:5,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>Desbloquear</button>
                  </div>
                ):<span style={{color:"#009c3b",fontFamily:"sans-serif",fontSize:13,fontWeight:700}}>✅ Admin ativo</span>}
              </div>

              {adminUnlocked&&(
                <>
                  <h3 style={{letterSpacing:4,color:"#ffdf00",marginBottom:12,fontSize:16}}>📝 INSERIR RESULTADOS REAIS</h3>
                  <div style={{display:"flex",gap:10,marginBottom:12}}>
                    <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)} style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",padding:"7px 10px",borderRadius:6,fontSize:12,fontFamily:"sans-serif",cursor:"pointer"}}>
                      {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  {filteredGames().map(g=><GameRow key={g.id} g={g} mode="admin"/>)}

                  {/* Pendentes deste bolão */}
                  {getPendingMembers(selectedBolao.id).length>0&&(
                    <div style={{marginTop:24}}>
                      <h3 style={{letterSpacing:4,color:"#ffdf00",marginBottom:12,fontSize:16}}>⏳ APROVAR PARTICIPANTES</h3>
                      {getPendingMembers(selectedBolao.id).map(m=>(
                        <div key={m.uid} style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.2)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:8}}>
                          <div style={{width:34,height:34,borderRadius:"50%",background:avatarColor(m.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff"}}>{m.apelido[0].toUpperCase()}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:16,letterSpacing:1}}>{m.apelido}</div>
                            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>👤 {m.nome} · 📱 <a href={`https://wa.me/55${m.whatsapp?.replace(/\D/g,"")}`} target="_blank" style={{color:"#25d366",textDecoration:"none"}}>{m.whatsapp}</a></div>
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>approveMember(selectedBolao.id,m.uid)} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✅ Aprovar</button>
                            <button onClick={()=>rejectMember(selectedBolao.id,m.uid)} style={{background:"#7a1010",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>❌ Rejeitar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div style={{marginTop:20,background:"rgba(0,156,59,.07)",border:"1px solid rgba(0,156,59,.3)",borderRadius:12,padding:"14px 18px"}}>
                <div style={{fontSize:14,letterSpacing:3,color:"#009c3b",marginBottom:8}}>🌐 API DE RESULTADOS</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <input type="text" placeholder="Chave football-data.org" value={apiKey} onChange={e=>{setApiKey(e.target.value);localStorage.setItem("bg26_apikey",e.target.value);}}
                    style={{flex:1,minWidth:180,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:6,padding:"7px 12px",fontSize:12,fontFamily:"monospace"}}/>
                  <button onClick={fetchLive} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:12,fontWeight:700}}>🔄 Atualizar</button>
                </div>
              </div>

              <div style={{marginTop:16,background:"rgba(255,255,255,.03)",border:"1px solid #1a1a1a",borderRadius:12,padding:"14px 18px"}}>
                <div style={{fontSize:14,letterSpacing:3,color:"#888",marginBottom:10}}>📖 REGRAS</div>
                {[["🎯","3 pts","Placar exato"],["✅","1 pt","Acertou vencedor/empate"],["❌","0 pts","Errou"]].map(([i,p,t])=>(
                  <div key={p} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,fontFamily:"sans-serif",fontSize:13}}>
                    <span style={{fontSize:18}}>{i}</span><span style={{color:"#ffdf00",fontWeight:700,minWidth:40}}>{p}</span><span style={{color:"#aaa"}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        <footer style={{textAlign:"center",padding:"16px",fontFamily:"sans-serif",fontSize:11,color:"#222",borderTop:"1px solid #0a0a0a",marginTop:24}}>
          ⚽ Bolão do Gestor · By Prof. Isaac Martins · 🇧🇷 Brasil Rumo ao Hexa
        </footer>
      </div>
    );
  }

  return <div style={{...BASE,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#ffdf00",fontSize:20,letterSpacing:4}}>⚽ Carregando...</div></div>;
}
