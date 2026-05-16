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

// Códigos de país ISO para usar com Twemoji/FlagCDN
const FLAG_CODES = {
  "Brasil":"br","Argentina":"ar","França":"fr","Alemanha":"de","Espanha":"es",
  "Inglaterra":"gb-eng","Portugal":"pt","México":"mx","EUA":"us","Uruguai":"uy",
  "Colômbia":"co","Canadá":"ca","Equador":"ec","Panamá":"pa","Bélgica":"be",
  "Marrocos":"ma","Japão":"jp","Holanda":"nl","Croácia":"hr","Austrália":"au",
  "Noruega":"no","Sérvia":"rs","Arábia Saudita":"sa","Senegal":"sn","Angola":"ao",
  "Tunísia":"tn","Dinamarca":"dk","Coreia do Sul":"kr","Suíça":"ch","Eslováquia":"sk",
  "Ucrânia":"ua","Argélia":"dz","África do Sul":"za","Tchéquia":"cz",
  "Bósnia-Herzegovina":"ba","Catar":"qa","Paraguai":"py","Turquia":"tr",
  "Costa do Marfim":"ci","Curacão":"cw","Suécia":"se","Cabo Verde":"cv",
  "Egito":"eg","Irã":"ir","Nova Zelândia":"nz","Iraque":"iq","Jordânia":"jo",
  "Áustria":"at","RD Congo":"cd","Uzbequistão":"uz","Gana":"gh","Haiti":"ht",
  "Escócia":"gb-sct","Curaçao":"cw",
};

const flag = (t, size=32) => {
  const code = FLAG_CODES[t];
  if (!code) return <span style={{fontSize:size,lineHeight:1}}>🏳️</span>;
  // Usa flagcdn.com - funciona em todos os navegadores sem depender de emoji
  return (
    <img
      src={`https://flagcdn.com/h${size}/${code}.png`}
      alt={t}
      style={{width:size,height:Math.round(size*0.75),objectFit:"cover",borderRadius:3,display:"inline-block",verticalAlign:"middle"}}
      onError={e=>{e.target.style.display="none";}}
    />
  );
};

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
  const [currentUser, setCurrentUser] = useState(null); // sempre começa sem sessão

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

  // States das telas de login/cadastro (movidos para cá para não violar regras do React)
  const [loginInput,   setLoginInput]   = useState("");
  const [loginError,   setLoginError]   = useState("");
  const [loginBolao,   setLoginBolao]   = useState("");
  const [cadBolao,     setCadBolao]     = useState("");
  const [cadNome,      setCadNome]      = useState("");
  const [cadApelido,   setCadApelido]   = useState("");
  const [cadEmail,     setCadEmail]     = useState("");
  const [cadWa,        setCadWa]        = useState("");
  const [cadError,     setCadError]     = useState("");
  const [purchaseInput,setPurchaseInput]= useState("");
  const [purchaseOk,   setPurchaseOk]   = useState(false);
  const [purchaseError,setPurchaseError]= useState("");
  const [showSenha,    setShowSenha]    = useState(false);
  const [subScreen,    setSubScreen]    = useState("menu");
  const [fontSize,     setFontSize]     = useState(() => parseInt(localStorage.getItem("bg26_fontsize")||"18"));

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

  // Sem persistência de sessão - cada pessoa faz login toda vez
  // useEffect(()=>{ localStorage.setItem("bg26_session", JSON.stringify(currentUser)); },[currentUser]);

  // ── Sem restauração automática de sessão ────────────────────────────────────
  // Cada pessoa deve fazer login manualmente para garantir identidade correta
  useEffect(() => {
    // Limpa qualquer sessão antiga ao carregar
    localStorage.removeItem("bg26_session");
    setCurrentUser(null);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getResult = id => results[id];
  const getGuessOf = (uid, bolaoId, id) => {
    const key = `${safeKey(bolaoId)}_${safeKey(uid)}`;
    return allGuesses[key]?.[id];
  };
  const myGuesses = (() => {
    if (!currentUser) return {};
    const key = `${safeKey(currentUser.bolaoId)}_${safeKey(currentUser.uid)}`;
    return allGuesses[key] || {};
  })();

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
    // Chave única: bolaoId + uid + gameId para evitar conflito entre bolões
    const key = `${safeKey(currentUser.bolaoId)}_${safeKey(currentUser.uid)}`;
    await set(dbRef(db, `guesses/${key}/${gameId}/${side}`), val);
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
        const r=getResult(g.id), gu=getGuessOf(m.uid,selectedBolao?.id,g.id);
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
  // TELA HOME — 3 botões principais
  if (screen==="home") {
    return (
      <div style={{...BASE, display:"flex", flexDirection:"column", minHeight:"100vh"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
          *{box-sizing:border-box;} input,select,button{font-family:inherit;}
          ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:linear-gradient(#009c3b,#002776);border-radius:3px;}
          @keyframes pop{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
          @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(255,223,0,.4)}50%{text-shadow:0 0 40px rgba(255,223,0,.8)}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          .btn-main:hover{transform:translateY(-3px)!important;box-shadow:0 8px 30px rgba(0,0,0,.5)!important;}
          .btn-main{transition:all .25s ease!important;}
        `}</style>

        {notification&&<div style={{position:"fixed",top:20,right:16,zIndex:999,animation:"pop .3s ease",background:notification.type==="err"?"#7a1010":notification.type==="warn"?"#7a5000":"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,.7)"}}>{notification.msg}</div>}

        {/* Faixa verde-amarela-azul no topo */}
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>

        {/* Conteúdo central */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 16px"}}>

          {/* Logo */}
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:72,animation:"float 3s ease-in-out infinite",marginBottom:8}}>⚽</div>
            <div style={{fontSize:52,letterSpacing:8,lineHeight:1,animation:"glow 3s ease-in-out infinite",
              background:"linear-gradient(135deg,#fff 30%,#ffdf00 70%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              BOLÃO DOS
            </div>
            <div style={{fontSize:52,letterSpacing:8,lineHeight:1,marginBottom:8,
              background:"linear-gradient(135deg,#ffdf00 30%,#fff 70%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              AMIGOS E FAMÍLIA
            </div>
            <div style={{fontSize:13,letterSpacing:4,color:"#ffdf00",fontFamily:"sans-serif",fontWeight:300,marginTop:6}}>
              By Prof. Isaac Martins · 🇧🇷 Brasil Rumo ao Hexa 🏆
            </div>
            <div style={{fontSize:12,letterSpacing:3,color:"#555",fontFamily:"sans-serif",marginTop:4}}>
              🇺🇸 EUA · 🇨🇦 CANADÁ · 🇲🇽 MÉXICO · Copa do Mundo 2026
            </div>
          </div>

          {/* 3 BOTÕES PRINCIPAIS */}
          <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:16}}>

            {/* ENTRAR NO BOLÃO */}
            <button className="btn-main" onClick={()=>setScreen("entrar")}
              style={{background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",
                borderRadius:14,padding:"22px 24px",cursor:"pointer",textAlign:"left",
                display:"flex",alignItems:"center",gap:18,
                boxShadow:"0 4px 20px rgba(0,156,59,.35)"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,.15)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🏟️</div>
              <div>
                <div style={{fontSize:24,letterSpacing:3}}>ENTRAR NO BOLÃO</div>
                <div style={{fontFamily:"sans-serif",fontSize:13,color:"rgba(255,255,255,.7)",marginTop:2}}>
                  Já sou cadastrado — quero jogar!
                </div>
              </div>
              <div style={{marginLeft:"auto",fontSize:22,color:"rgba(255,255,255,.5)"}}>▶</div>
            </button>

            {/* NOVO CADASTRO */}
            <button className="btn-main" onClick={()=>setScreen("cadastro")}
              style={{background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",border:"none",
                borderRadius:14,padding:"22px 24px",cursor:"pointer",textAlign:"left",
                display:"flex",alignItems:"center",gap:18,
                boxShadow:"0 4px 20px rgba(200,162,0,.3)"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,.15)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>📝</div>
              <div>
                <div style={{fontSize:24,letterSpacing:3}}>NOVO CADASTRO</div>
                <div style={{fontFamily:"sans-serif",fontSize:13,color:"rgba(255,255,255,.7)",marginTop:2}}>
                  Ainda não participo — quero me cadastrar!
                </div>
              </div>
              <div style={{marginLeft:"auto",fontSize:22,color:"rgba(255,255,255,.5)"}}>▶</div>
            </button>

            {/* ADMINISTRADOR */}
            <button className="btn-main" onClick={()=>setScreen("admin_global")}
              style={{background:"linear-gradient(135deg,#1a3a6a,#0d1f3a)",color:"#fff",border:"1px solid rgba(255,255,255,.1)",
                borderRadius:14,padding:"22px 24px",cursor:"pointer",textAlign:"left",
                display:"flex",alignItems:"center",gap:18,
                boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,.1)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🔐</div>
              <div>
                <div style={{fontSize:24,letterSpacing:3}}>ADMINISTRADOR</div>
                <div style={{fontFamily:"sans-serif",fontSize:13,color:"rgba(255,255,255,.5)",marginTop:2}}>
                  Gerenciar bolões e participantes
                </div>
              </div>
              <div style={{marginLeft:"auto",fontSize:22,color:"rgba(255,255,255,.3)"}}>▶</div>
            </button>

          </div>
        </div>

        {/* Faixa verde-amarela-azul no rodapé */}
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
        <div style={{textAlign:"center",padding:"12px",fontFamily:"sans-serif",fontSize:11,color:"#222"}}>
          bolao-do-gestor.vercel.app
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA ENTRAR
  if (screen==="entrar") {
    const bList = Object.entries(boloes).filter(([,b])=>b.ativo);

    async function handleLogin() {
      setLoginError("");
      const bid = loginBolao;
      if (!bid) { setLoginError("Selecione um bolão."); return; }
      const mList = getMembersOfBolao(bid);
      const termo = loginInput.trim().toLowerCase();
      if (!termo) { setLoginError("Digite seu nome, email ou WhatsApp."); return; }
      const found = mList.find(m =>
        m.apelido?.toLowerCase()===termo ||
        m.nome?.toLowerCase().includes(termo) ||
        m.email?.toLowerCase()===termo ||
        m.whatsapp?.replace(/\D/g,"").endsWith(termo.replace(/\D/g,""))
      );
      if (!found) { setLoginError("Não encontrado. Verifique os dados ou cadastre-se."); return; }
      if (found.status==="pendente") { setScreen("pending"); return; }
      if (found.status==="rejeitado") { setLoginError("Seu cadastro foi recusado. Fale com o administrador."); return; }
      const bolao = boloes[bid];
      setSelectedBolao({id:bid,...bolao});
      setCurrentUser({uid:found.uid, apelido:found.apelido, bolaoId:bid});
      setScreen("bolao");
      notify(`⚽ Bem-vindo(a), ${found.apelido}!`);
    }

    return (
      <div style={{...BASE,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}input,select,button{font-family:inherit;}@keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
        {notification&&<div style={{position:"fixed",top:20,right:16,zIndex:999,animation:"pop .3s ease",background:"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13}}>{notification.msg}</div>}

        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
          <div style={{width:"100%",maxWidth:440}}>
            <button onClick={()=>setScreen("home")} style={{background:"transparent",color:"#777",border:"none",cursor:"pointer",fontSize:13,fontFamily:"sans-serif",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
              ← Voltar
            </button>

            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:40,marginBottom:8}}>🏟️</div>
              <div style={{fontSize:32,letterSpacing:5,color:"#ffdf00"}}>ENTRAR NO BOLÃO</div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:"#777",marginTop:4}}>
                Identifique-se para acessar seus palpites
              </div>
            </div>

            <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,223,0,.2)",borderRadius:14,padding:"28px"}}>

              {/* Seleção do bolão */}
              {bList.length > 1 && (
                <div style={{marginBottom:18}}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:6}}>QUAL É O SEU BOLÃO?</div>
                  <select value={loginBolao} onChange={e=>setLoginBolao(e.target.value)}
                    style={{width:"100%",background:"#050d0a",color:"#ffdf00",border:"2px solid #009c3b",borderRadius:8,padding:"10px 14px",fontSize:14,cursor:"pointer"}}>
                    {bList.map(([id,b])=><option key={id} value={id}>{b.nome}</option>)}
                  </select>
                </div>
              )}
              {bList.length === 1 && (
                <div style={{background:"rgba(0,156,59,.1)",border:"1px solid rgba(0,156,59,.3)",borderRadius:8,padding:"10px 14px",marginBottom:18,fontFamily:"sans-serif",fontSize:13,color:"#009c3b"}}>
                  ⚽ {bList[0][1].nome}
                </div>
              )}

              {/* Input de identificação */}
              <div style={{marginBottom:8}}>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:6}}>
                  SEU NOME, EMAIL OU WHATSAPP
                </div>
                <input type="text" placeholder="Ex: Isaac, isaac@email.com ou 11987654321"
                  value={loginInput} onChange={e=>{setLoginInput(e.target.value);setLoginError("");}}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",
                    borderRadius:8,padding:"12px 14px",fontSize:15,outline:"none",fontFamily:"sans-serif"}}/>
              </div>

              {loginError&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:12}}>{loginError}</div>}

              <button onClick={handleLogin}
                style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
                  border:"none",borderRadius:10,padding:"14px",fontSize:18,letterSpacing:3,
                  cursor:"pointer",marginTop:8,boxShadow:"0 4px 16px rgba(0,156,59,.3)"}}>
                ENTRAR ⚽
              </button>

              <div style={{textAlign:"center",marginTop:16,fontFamily:"sans-serif",fontSize:12,color:"#555"}}>
                Não está cadastrado?{" "}
                <button onClick={()=>setScreen("cadastro")} style={{background:"none",border:"none",color:"#ffdf00",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>
                  Cadastre-se aqui
                </button>
              </div>
            </div>
          </div>
        </div>
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA CADASTRO
  if (screen==="cadastro") {
    const bList = Object.entries(boloes).filter(([,b])=>b.ativo);

    async function handleCadastro() {
      setCadError("");
      if (!cadBolao)           { setCadError("Selecione um bolão."); return; }
      if (!cadNome.trim())     { setCadError("Digite seu nome completo."); return; }
      if (!cadApelido.trim())  { setCadError("Escolha um apelido."); return; }
      if (!cadEmail.trim() && !cadWa.trim()) { setCadError("Preencha email ou WhatsApp."); return; }
      const uid = safeKey(cadApelido.trim());
      if (members[cadBolao]?.[uid]) { setCadError("Este apelido já está em uso. Escolha outro."); return; }
      try {
        await set(dbRef(db, `members/${cadBolao}/${uid}`), {
          nome: cadNome.trim(),
          apelido: cadApelido.trim(),
          email: cadEmail.trim().toLowerCase(),
          whatsapp: cadWa.trim(),
          status: "pendente",
          createdAt: new Date().toISOString(),
        });
        setScreen("pending");
      } catch { setCadError("Erro ao enviar. Tente novamente."); }
    }

    return (
      <div style={{...BASE,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}input,select,button{font-family:inherit;}input:focus{outline:none;}`}</style>
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>

        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
          <div style={{width:"100%",maxWidth:440}}>
            <button onClick={()=>setScreen("home")} style={{background:"transparent",color:"#777",border:"none",cursor:"pointer",fontSize:13,fontFamily:"sans-serif",marginBottom:20}}>
              ← Voltar
            </button>

            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:40,marginBottom:8}}>📝</div>
              <div style={{fontSize:30,letterSpacing:5,color:"#ffdf00"}}>NOVO CADASTRO</div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:"#777",marginTop:4}}>
                Preencha os dados — o admin irá aprovar seu acesso
              </div>
            </div>

            <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,223,0,.2)",borderRadius:14,padding:"28px"}}>

              {/* Seleção do bolão */}
              {bList.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:5}}>QUAL BOLÃO QUER PARTICIPAR? *</div>
                  <select value={cadBolao} onChange={e=>setCadBolao(e.target.value)}
                    style={{width:"100%",background:"#050d0a",color:"#ffdf00",border:"2px solid #009c3b",borderRadius:8,padding:"10px 14px",fontSize:14,cursor:"pointer"}}>
                    {bList.map(([id,b])=><option key={id} value={id}>{b.nome}</option>)}
                  </select>
                </div>
              )}

              {[
                {label:"Nome completo *",      val:cadNome,    set:setCadNome,    ph:"Ex: Maria da Silva",          type:"text"},
                {label:"Apelido no bolão *",   val:cadApelido, set:setCadApelido, ph:"Ex: Maria, Maju, Silva...",   type:"text"},
                {label:"Email",                val:cadEmail,   set:setCadEmail,   ph:"Ex: maria@email.com",         type:"email"},
                {label:"WhatsApp com DDD",     val:cadWa,      set:setCadWa,      ph:"Ex: 11987654321",             type:"tel"},
              ].map(f=>(
                <div key={f.label} style={{marginBottom:14}}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:5}}>{f.label.toUpperCase()}</div>
                  <input type={f.type} placeholder={f.ph} value={f.val}
                    onChange={e=>{f.set(e.target.value);setCadError("");}}
                    style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",
                      borderRadius:8,padding:"11px 14px",fontSize:14,fontFamily:"sans-serif"}}/>
                </div>
              ))}

              {cadError&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:10}}>{cadError}</div>}

              <button onClick={handleCadastro}
                style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",
                  border:"none",borderRadius:10,padding:"14px",fontSize:18,letterSpacing:3,
                  cursor:"pointer",marginTop:4,boxShadow:"0 4px 16px rgba(200,162,0,.3)"}}>
                SOLICITAR PARTICIPAÇÃO 📝
              </button>

              <div style={{textAlign:"center",marginTop:14,fontFamily:"sans-serif",fontSize:12,color:"#555"}}>
                Já tem cadastro?{" "}
                <button onClick={()=>setScreen("entrar")} style={{background:"none",border:"none",color:"#009c3b",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>
                  Entrar aqui
                </button>
              </div>
            </div>
          </div>
        </div>
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA ADMIN GLOBAL
  if (screen==="admin_global") {
    const PURCHASE_CODE = "GESTOR2026";

    function checkPurchaseCode() {
      if (purchaseInput.trim().toUpperCase() === PURCHASE_CODE) {
        setPurchaseOk(true);
        setPurchaseError("");
      } else {
        setPurchaseError("Código incorreto. Verifique e tente novamente.");
      }
    }

    return (
      <div style={BASE}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}input,select,button{font-family:inherit;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:#009c3b;border-radius:3px;}@keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@keyframes reveal{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
        {notification&&<div style={{position:"fixed",top:20,right:16,zIndex:999,animation:"pop .3s ease",background:notification.type==="err"?"#7a1010":"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13}}>{notification.msg}</div>}

        <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"transparent",color:"#777",border:"none",cursor:"pointer",fontSize:13,fontFamily:"sans-serif",marginBottom:20}}>
            ← Voltar
          </button>

          {/* ETAPA 1 — Código de compra */}
          {!purchaseOk && (
            <div style={{maxWidth:420,margin:"40px auto",textAlign:"center"}}>
              <div style={{fontSize:52,marginBottom:12}}>🔑</div>
              <div style={{fontSize:26,letterSpacing:4,color:"#ffdf00",marginBottom:6}}>ÁREA DO ADMINISTRADOR</div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:"#888",marginBottom:28,lineHeight:1.7}}>
                Para acessar o painel, insira o <strong style={{color:"#fff"}}>código de compra</strong> do Bolão do Gestor.
              </div>

              <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,223,0,.25)",borderRadius:14,padding:"28px",textAlign:"left"}}>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:8}}>
                  CÓDIGO DE COMPRA
                </div>
                <input type="text" placeholder="Ex: GESTOR2026"
                  value={purchaseInput}
                  onChange={e=>{setPurchaseInput(e.target.value.toUpperCase());setPurchaseError("");}}
                  onKeyDown={e=>e.key==="Enter"&&checkPurchaseCode()}
                  style={{width:"100%",background:"#050d0a",color:"#ffdf00",border:"2px solid #c8a200",
                    borderRadius:8,padding:"12px 14px",fontSize:18,letterSpacing:4,
                    fontFamily:"monospace",marginBottom:10,outline:"none",textAlign:"center"}}/>
                {purchaseError&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:10,textAlign:"center"}}>{purchaseError}</div>}
                <button onClick={checkPurchaseCode}
                  style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",
                    border:"none",borderRadius:10,padding:"13px",fontSize:17,letterSpacing:3,cursor:"pointer"}}>
                  VALIDAR CÓDIGO 🔑
                </button>
              </div>

              <div style={{marginTop:16,fontFamily:"sans-serif",fontSize:11,color:"#444"}}>
                Não tem o código? Entre em contato com o Prof. Isaac Martins.
              </div>
            </div>
          )}

          {/* ETAPA 2 — Código validado, mostra senha e pede confirmação */}
          {purchaseOk && !adminUnlocked && (
            <div style={{maxWidth:420,margin:"40px auto",textAlign:"center"}}>
              <div style={{fontSize:52,marginBottom:12,animation:"reveal .4s ease"}}>✅</div>
              <div style={{fontSize:24,letterSpacing:4,color:"#009c3b",marginBottom:6}}>CÓDIGO VALIDADO!</div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:"#888",marginBottom:24}}>
                Sua senha de administrador foi gerada. Guarde-a com segurança.
              </div>

              <div style={{background:"rgba(0,156,59,.08)",border:"1px solid rgba(0,156,59,.4)",borderRadius:14,padding:"24px",marginBottom:20,animation:"reveal .5s ease"}}>
                <div style={{fontFamily:"sans-serif",fontSize:12,color:"#777",marginBottom:10,letterSpacing:1}}>SUA SENHA DE ADMINISTRADOR</div>
                <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
                  <div style={{fontSize:32,letterSpacing:8,color:"#ffdf00",fontFamily:"monospace",
                    filter:showSenha?"none":"blur(8px)",transition:"filter .3s",userSelect:showSenha?"text":"none"}}>
                    {ADMIN_PASS}
                  </div>
                  <button onClick={()=>setShowSenha(s=>!s)}
                    style={{background:"rgba(255,255,255,.1)",border:"1px solid #444",color:"#aaa",
                      borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>
                    {showSenha?"🙈 Ocultar":"👁️ Ver"}
                  </button>
                </div>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#555",marginTop:10}}>
                  Use esta senha sempre que acessar o painel de administrador
                </div>
              </div>

              <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,223,0,.2)",borderRadius:14,padding:"24px",textAlign:"left"}}>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:8}}>
                  CONFIRME SUA SENHA PARA ENTRAR
                </div>
                <input type="password" placeholder="Digite a senha acima"
                  value={adminInput} onChange={e=>setAdminInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(adminInput===ADMIN_PASS?setAdminUnlocked(true):notify("Senha incorreta","err"))}
                  style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",
                    borderRadius:8,padding:"12px 14px",fontSize:16,fontFamily:"sans-serif",
                    marginBottom:10,outline:"none",textAlign:"center",letterSpacing:4}}/>
                <button onClick={()=>adminInput===ADMIN_PASS?setAdminUnlocked(true):notify("Senha incorreta","err")}
                  style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
                    border:"none",borderRadius:10,padding:"13px",fontSize:17,letterSpacing:3,cursor:"pointer"}}>
                  ACESSAR PAINEL 🔐
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3 — Painel admin desbloqueado */}
          {purchaseOk && adminUnlocked && (
            <AdminGlobalPanel
              db={db} boloes={boloes} members={members} results={results}
              notify={notify} apiKey={apiKey} setApiKey={setApiKey}
              fetchLive={fetchLive} liveFetching={liveFetching} lastUpdate={lastUpdate}
              newBolaoNome={newBolaoNome} setNewBolaoNome={setNewBolaoNome}
              newBolaoDesc={newBolaoDesc} setNewBolaoDesc={setNewBolaoDesc}
              createBolao={createBolao} approveMember={approveMember}
              rejectMember={rejectMember} removeMember={removeMember}
              getMembersOfBolao={getMembersOfBolao} getApprovedMembers={getApprovedMembers}
              getPendingMembers={getPendingMembers} avatarColor={avatarColor}
              onVoltar={()=>setScreen("home")}
            />
          )}
        </div>
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TELA PENDENTE
  if (screen==="pending") {
    return (
      <div style={BASE}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box;}`}</style>
        <div style={{height:5,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
        <div style={{maxWidth:440,margin:"60px auto",padding:"0 16px",textAlign:"center"}}>
          <div style={{fontSize:64,marginBottom:16}}>⏳</div>
          <div style={{fontSize:26,letterSpacing:4,color:"#ffdf00",marginBottom:12}}>CADASTRO ENVIADO!</div>
          <div style={{fontFamily:"sans-serif",fontSize:15,color:"#aaa",lineHeight:2,marginBottom:24,background:"rgba(255,255,255,.04)",border:"1px solid #1a2a1a",borderRadius:12,padding:"20px"}}>
            Seu cadastro foi enviado para o <strong style={{color:"#fff"}}>Administrador</strong>.<br/>
            Assim que for aprovado, você já poderá entrar no bolão.<br/><br/>
            <span style={{fontSize:22}}>📲</span><br/>
            <strong style={{color:"#ffdf00"}}>Dica:</strong> Avise o <strong style={{color:"#fff"}}>Administrador</strong> pelo WhatsApp que você se cadastrou para agilizar a aprovação!
          </div>
          <button onClick={()=>{setScreen("home");setSelectedBolao(null);}}
            style={{background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:10,padding:"14px 28px",fontSize:16,letterSpacing:2,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,156,59,.3)"}}>
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
      const past=isPast(g.date), today=isToday(g.date);
      const hasR=r&&r.home!==""&&r.home!==undefined&&r.away!==undefined;
      const locked=past&&!adminUnlocked;

      // Cores do card
      const border = pts===3?"#009c3b":pts===1?"#c8a200":pts===0&&hasR?"#5a1010":today?"#ffdf00":hasR?"#009c3b":"#1a2e1a";
      const bg     = pts===3?"rgba(0,156,59,.1)":pts===1?"rgba(200,162,0,.08)":pts===0&&hasR?"rgba(90,16,16,.1)":today?"rgba(255,223,0,.06)":hasR?"rgba(0,156,59,.05)":"rgba(255,255,255,.02)";

      return (
        <div style={{background:bg,border:`2px solid ${border}`,borderRadius:16,overflow:"hidden",marginBottom:12,boxShadow:today?"0 0 16px rgba(255,223,0,.12)":"none"}}>

          {/* Cabeçalho — data, hora, cidade */}
          <div style={{background:today?"rgba(255,223,0,.15)":"rgba(255,255,255,.05)",borderBottom:`1px solid ${border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              {today&&<span style={{background:"#cc0000",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,letterSpacing:1,animation:"pulse 1.5s infinite"}}>🔴 HOJE</span>}
              <span style={{fontSize:fs(15),color:"#ffdf00",fontWeight:700,letterSpacing:1,fontFamily:"sans-serif"}}>{fmtDate(g.date)}</span>
              <span style={{fontSize:fs(22),color:"#fff",fontWeight:900,letterSpacing:2}}>{fmtTime(g.date)}</span>
              <span style={{fontSize:fs(12),color:"#777",fontFamily:"sans-serif"}}>📍 {g.city}</span>
            </div>
            <span style={{
              background:g.knockout?"#3a0050":today?"rgba(255,223,0,.2)":"#002776",
              color:g.knockout?"#ddaaff":today?"#ffdf00":"#aaa",
              fontSize:fs(11),padding:"3px 10px",borderRadius:20,fontFamily:"sans-serif",fontWeight:700
            }}>
              {g.knockout?(PHASE_LABEL[g.group]||g.group):`GRUPO ${g.group}`}
            </span>
          </div>

          {/* Corpo — times e placar/palpite */}
          <div style={{padding:"16px"}}>

            {/* Times e placar — layout 3 colunas */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8,marginBottom: mode==="meus"&&hasR&&gu ? 12 : 0}}>

              {/* Time da casa */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                {flag(g.home, 48)}
                <span style={{fontSize:fs(14),letterSpacing:1,textAlign:"center",lineHeight:1.2,fontFamily:"sans-serif",fontWeight:700,color:"#fff"}}>{g.home}</span>
              </div>

              {/* Placar / inputs no centro */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                {mode==="meus" ? (
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min="0" max="20"
                      value={gu?.home??""} disabled={locked}
                      onChange={e=>saveGuess(g.id,"home",e.target.value)}
                      placeholder="–"
                      style={{
                        width:56,height:56,textAlign:"center",
                        background:locked?"#111":"#060f06",
                        color:"#fff",
                        border:`3px solid ${locked?"#2a2a2a":"#009c3b"}`,
                        borderRadius:10,fontSize:fs(26),
                        fontFamily:"monospace",
                        opacity:locked?.5:1,
                        touchAction:"manipulation"
                      }}/>
                    <span style={{fontSize:fs(24),color:"#ffdf00",fontWeight:900}}>×</span>
                    <input type="number" min="0" max="20"
                      value={gu?.away??""} disabled={locked}
                      onChange={e=>saveGuess(g.id,"away",e.target.value)}
                      placeholder="–"
                      style={{
                        width:56,height:56,textAlign:"center",
                        background:locked?"#111":"#060f06",
                        color:"#fff",
                        border:`3px solid ${locked?"#2a2a2a":"#009c3b"}`,
                        borderRadius:10,fontSize:fs(26),
                        fontFamily:"monospace",
                        opacity:locked?.5:1,
                        touchAction:"manipulation"
                      }}/>
                  </div>
                ) : mode==="admin" ? (
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min="0" max="20"
                      value={r?.home??""} onChange={e=>saveResult(g.id,"home",e.target.value)}
                      placeholder="–"
                      style={{width:56,height:56,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"3px solid #ffdf00",borderRadius:10,fontSize:fs(26),fontFamily:"monospace",touchAction:"manipulation"}}/>
                    <span style={{fontSize:fs(24),color:"#fff",fontWeight:900}}>×</span>
                    <input type="number" min="0" max="20"
                      value={r?.away??""} onChange={e=>saveResult(g.id,"away",e.target.value)}
                      placeholder="–"
                      style={{width:56,height:56,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"3px solid #ffdf00",borderRadius:10,fontSize:fs(26),fontFamily:"monospace",touchAction:"manipulation"}}/>
                  </div>
                ) : hasR ? (
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:fs(38),letterSpacing:6,color:"#ffdf00",fontWeight:900,fontFamily:"monospace",lineHeight:1}}>
                      {r.home}<span style={{color:"#555",fontSize:fs(24)}}>×</span>{r.away}
                    </div>
                    <div style={{fontSize:fs(11),color:"#009c3b",fontFamily:"sans-serif",marginTop:2}}>✅ Finalizado</div>
                  </div>
                ) : (
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:fs(32),color:"#2a2a2a",fontFamily:"monospace",letterSpacing:4}}>–×–</div>
                    <div style={{fontSize:fs(11),color:today?"#ffdf00":"#555",fontFamily:"sans-serif",marginTop:2}}>
                      {today?"🕐 Em breve":past?"⏳ Aguardando":"📅 "+fmtDate(g.date)}
                    </div>
                  </div>
                )}

                {/* Palpite do usuário vs resultado real */}
                {mode==="meus"&&hasR&&gu&&(
                  <div style={{
                    background:pts===3?"#009c3b":pts===1?"#c8a200":pts===0?"#5a1010":"#333",
                    color:pts===1?"#fff":"#fff",
                    padding:"4px 14px",borderRadius:20,
                    fontFamily:"sans-serif",fontSize:fs(13),fontWeight:700,
                    display:"flex",alignItems:"center",gap:6
                  }}>
                    {pts===3?"🎯 3 pontos!":pts===1?"✅ 1 ponto":"❌ 0 ponto"}
                  </div>
                )}

                {/* Bloqueado */}
                {mode==="meus"&&locked&&!hasR&&(
                  <div style={{fontSize:fs(12),color:"#444",fontFamily:"sans-serif"}}>🔒 Bloqueado</div>
                )}
              </div>

              {/* Time visitante */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                {flag(g.away, 48)}
                <span style={{fontSize:fs(14),letterSpacing:1,textAlign:"center",lineHeight:1.2,fontFamily:"sans-serif",fontWeight:700,color:"#fff"}}>{g.away}</span>
              </div>
            </div>

            {/* Linha de resultado real (quando tem palpite) */}
            {mode==="meus"&&hasR&&gu&&(
              <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:fs(12),color:"#666",marginTop:4}}>
                Resultado: {r.home}×{r.away} · Seu palpite: {gu.home}×{gu.away}
              </div>
            )}
          </div>
        </div>
      );
    };

    const changeFontSize = (delta) => {
      const nf = Math.min(24, Math.max(13, fontSize+delta));
      setFontSize(nf);
      localStorage.setItem("bg26_fontsize", String(nf));
    };
    const fs = (base) => Math.round(base * fontSize / 16);

    return (
      <div style={BASE}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
          *{box-sizing:border-box;} input,select,button{font-family:inherit;}
          ::-webkit-scrollbar{width:5px;height:5px;}
          ::-webkit-scrollbar-thumb{background:linear-gradient(#009c3b,#002776);border-radius:3px;}
          @keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          .mbtn:hover{transform:translateY(-2px)!important;filter:brightness(1.1)!important;}
          .mbtn{transition:all .2s ease!important;}
          input[type=number]::-webkit-inner-spin-button{opacity:.5;}
          input:focus{outline:none;}
        `}</style>

        {notification&&<div style={{position:"fixed",top:16,right:16,zIndex:999,animation:"pop .3s ease",background:notification.type==="err"?"#7a1010":notification.type==="warn"?"#7a5000":"#005a22",color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:fs(13),boxShadow:"0 4px 20px rgba(0,0,0,.7)"}}>{notification.msg}</div>}

        {/* HEADER com nome do usuário + controles de fonte */}
        <header>
          <div style={{background:"linear-gradient(135deg,#004d22,#009c3b 25%,#002776 60%,#001240)"}}>
            <div style={{background:"rgba(0,0,0,.55)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{cursor:"pointer"}} onClick={()=>setSubScreen("menu")}>
                <div style={{fontSize:fs(28),letterSpacing:5,lineHeight:1,textShadow:"0 0 20px rgba(255,223,0,.3)"}}>⚽ BOLÃO DOS AMIGOS E FAMÍLIA</div>
                <div style={{fontSize:fs(11),letterSpacing:3,color:"#ffdf00",fontFamily:"sans-serif",fontWeight:300}}>{selectedBolao.nome} · By Prof. Isaac Martins · 🇧🇷 Rumo ao Hexa</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                {/* Controle de fonte */}
                <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,.08)",borderRadius:20,padding:"4px 10px"}}>
                  <span style={{fontFamily:"sans-serif",fontSize:fs(10),color:"#888"}}>A</span>
                  <button onClick={()=>changeFontSize(-1)} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:4,width:22,height:22,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                  <button onClick={()=>changeFontSize(1)}  style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:4,width:22,height:22,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  <span style={{fontFamily:"sans-serif",fontSize:fs(14),color:"#fff",fontWeight:700}}>A</span>
                </div>
                {/* Info usuário */}
                <div style={{textAlign:"right"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:avatarColor(currentUser.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(13),fontWeight:700,color:"#fff"}}>{currentUser.apelido[0].toUpperCase()}</div>
                    <div>
                      <div style={{fontSize:fs(15),color:"#ffdf00"}}>{currentUser.apelido}</div>
                      <div style={{fontSize:fs(10),color:"#aaa",fontFamily:"sans-serif"}}>{myRank>0?`${myRank}º · ${myPts} pts`:"0 pts"}</div>
                    </div>
                  </div>
                </div>
                <button onClick={()=>{
                  localStorage.removeItem("bg26_session");
                  setCurrentUser(null);
                  setScreen("entrar");
                  setSelectedBolao(null);
                }} style={{background:"#cc0000",border:"none",color:"#fff",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:fs(12),fontFamily:"sans-serif",fontWeight:700}}>
                  🔄 Trocar Usuário
                </button>
              </div>
            </div>
          </div>
          <div style={{height:4,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
        </header>

        {/* ═══ BARRA DE NAVEGAÇÃO FIXA ═══ */}
        <div style={{background:"rgba(0,0,0,.92)",borderBottom:"2px solid #1a2a1a",position:"sticky",top:0,zIndex:100}}>

          {/* Linha 1: Atualizar + botões de seção */}
          <div style={{padding:"6px 10px",display:"flex",alignItems:"center",gap:6,overflowX:"auto",flexWrap:"nowrap"}}>
            <button onClick={fetchLive} disabled={liveFetching} style={{
              background:liveFetching?"#1a1a1a":"linear-gradient(135deg,#009c3b,#006622)",
              color:"#fff",border:"none",borderRadius:7,padding:"7px 12px",
              cursor:"pointer",fontSize:fs(12),fontWeight:700,flexShrink:0,whiteSpace:"nowrap"
            }}>{liveFetching?"⏳":"🔄"} Atualizar</button>

            <div style={{width:1,height:24,background:"#2a2a2a",flexShrink:0}}/>

            {[
              {icon:"⚽",label:"Meus Palpites",   sub:"menu_meus",    bg:"#006622",active:"#009c3b"},
              {icon:"👀",label:"Palpites Bolão",  sub:"menu_todos",   bg:"#003355",active:"#005580"},
              {icon:"🏆",label:"Classificação",   sub:"menu_ranking", bg:"#7a5000",active:"#c8a200"},
              {icon:"📅",label:"Hoje",             sub:"menu_hoje",    bg:"#6a0000",active:"#cc0000"},
              {icon:"🗓️",label:"Agenda",           sub:"menu_agenda",  bg:"#1a1a6a",active:"#2a2aaa"},
              {icon:"🔐",label:"Admin",            sub:"menu_admin",   bg:"#2a0040",active:"#6a00aa"},
            ].map(b=>(
              <button key={b.sub} onClick={()=>setSubScreen(b.sub)} style={{
                background:subScreen===b.sub?b.active:b.bg,
                color:"#fff",border:`1px solid ${subScreen===b.sub?b.active:"#333"}`,
                borderRadius:7,padding:"7px 12px",cursor:"pointer",
                fontSize:fs(12),fontWeight:700,flexShrink:0,whiteSpace:"nowrap",
                transition:".15s",opacity:subScreen===b.sub?1:.75
              }}>{b.icon} {b.label}</button>
            ))}
          </div>

          {/* Linha 2: Filtros rápidos de grupo (só nas seções de jogos) */}
          {(subScreen==="menu_meus"||subScreen==="menu_todos"||subScreen==="menu_agenda"||subScreen==="menu_hoje")&&(
            <div style={{padding:"0 10px 7px",display:"flex",alignItems:"center",gap:5,overflowX:"auto",flexWrap:"nowrap"}}>
              <span style={{fontFamily:"sans-serif",fontSize:fs(10),color:"#555",flexShrink:0,letterSpacing:1}}>FILTRO:</span>
              {["Todos","Hoje",...GROUPS.map(g=>g),"32 Avos","Oitavas","Quartas","Semifinal","Final"].map(g=>{
                const label = g.length===1 ? "G"+g : g==="Todos"?"Todos":g==="Hoje"?"Hoje":g==="32 Avos"?"32A":g==="Oitavas"?"OIT":g==="Quartas"?"QUA":g==="Semifinal"?"SEMI":g==="Final"?"FINAL":g;
                const active = filterGroup===g || (filterGroup==="Grupo "+g && !["Todos","Hoje","32 Avos","Oitavas","Quartas","Semifinal","Final"].includes(g));
                const fgVal = GROUPS.includes(g) ? "Grupo "+g : g;
                return(
                  <button key={g} onClick={()=>setFilterGroup(fgVal)} style={{
                    background:active?"#ffdf00":"rgba(255,255,255,.07)",
                    color:active?"#000":"#aaa",border:`1px solid ${active?"#ffdf00":"#2a2a2a"}`,
                    borderRadius:6,padding:"4px 10px",cursor:"pointer",
                    fontSize:fs(11),fontWeight:active?700:400,flexShrink:0,
                    fontFamily:"sans-serif",transition:".15s"
                  }}>{label}</button>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ MENU PRINCIPAL — 6 botões (tela inicial) ═══ */}
        {subScreen==="menu" && (
          <div style={{maxWidth:600,margin:"0 auto",padding:"24px 14px",animation:"fadeIn .3s ease"}}>
            <div style={{fontFamily:"sans-serif",fontSize:fs(13),color:"#777",textAlign:"center",marginBottom:20,letterSpacing:2}}>
              OLÁ, {currentUser.apelido.toUpperCase()}! O QUE DESEJA VER?
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[
                {icon:"⚽",label:"Meus\nPalpites",          color:"linear-gradient(135deg,#006622,#009c3b)", sub:"menu_meus",    border:"#009c3b"},
                {icon:"👀",label:"Palpites\ndo Bolão",       color:"linear-gradient(135deg,#003355,#005580)", sub:"menu_todos",   border:"#005580"},
                {icon:"🏆",label:"Classificação\ndo Bolão",  color:"linear-gradient(135deg,#7a5000,#c8a200)", sub:"menu_ranking", border:"#c8a200"},
                {icon:"📅",label:"Jogos\nde Hoje",           color:"linear-gradient(135deg,#6a0000,#cc0000)", sub:"menu_hoje",    border:"#cc0000"},
                {icon:"🗓️",label:"Tabela\ndos Jogos",        color:"linear-gradient(135deg,#1a1a6a,#2a2aaa)", sub:"menu_agenda",  border:"#2a2aaa"},
                {icon:"🔐",label:"Adminis-\ntrador",          color:"linear-gradient(135deg,#2a0040,#6a00aa)", sub:"menu_admin",   border:"#6a00aa"},
              ].map(b=>(
                <button key={b.sub} className="mbtn" onClick={()=>setSubScreen(b.sub)}
                  style={{background:b.color,border:`2px solid ${b.border}`,borderRadius:16,
                    padding:"24px 14px",cursor:"pointer",color:"#fff",textAlign:"center",
                    boxShadow:`0 4px 20px rgba(0,0,0,.4)`,minHeight:130,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
                  <div style={{fontSize:fs(44)}}>{b.icon}</div>
                  <div style={{fontSize:fs(18),letterSpacing:2,lineHeight:1.2,whiteSpace:"pre-line"}}>{b.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <main style={{maxWidth:1040,margin:"0 auto",padding:"18px 12px",display:subScreen==="menu"?"none":"block"}}>

          {/* HOJE */}
          {subScreen==="menu_hoje"&&(
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
                              const gu=getGuessOf(m.uid,selectedBolao?.id,g.id);
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

          {/* AGENDA */}
          {subScreen==="menu_agenda"&&(
            <div>
              {filteredGames().map(g=><GameRow key={g.id} g={g}/>)}
            </div>
          )}

          {/* MEUS PALPITES */}
          {subScreen==="menu_meus"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                <div style={{width:fs(32),height:fs(32),borderRadius:"50%",background:avatarColor(currentUser.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(15),fontWeight:700,color:"#fff"}}>{currentUser.apelido[0].toUpperCase()}</div>
                <span style={{fontSize:fs(20),letterSpacing:2,color:"#ffdf00"}}>{currentUser.apelido}</span>
                <span style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#555"}}>
                  {filteredGames().filter(g=>myGuesses[g.id]?.home!==undefined).length}/{filteredGames().length} preenchidos
                </span>
              </div>
              {filteredGames().map(g=><GameRow key={g.id} g={g} mode="meus"/>)}
              <p style={{textAlign:"center",marginTop:14,fontFamily:"sans-serif",fontSize:fs(11),color:"#444"}}>💾 Salvo em tempo real · 🔒 Bloqueado após início</p>
            </div>
          )}

          {/* PALPITES DO BOLÃO */}
          {subScreen==="menu_todos"&&(
            <div>
              <div style={{fontSize:fs(20),letterSpacing:4,color:"#ffdf00",marginBottom:6}}>👀 PALPITES DE TODOS</div>
              <p style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#777",marginBottom:14}}>Palpites revelados após o início de cada jogo.</p>
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
                        {flag(g.home,24)}<strong>{g.home}</strong>
                        {hasR?<span style={{color:"#ffdf00",fontSize:20,fontWeight:900,letterSpacing:3}}>{r.home}×{r.away}</span>:<span style={{color:"#333",fontSize:16}}>×</span>}
                        <strong>{g.away}</strong>{flag(g.away,24)}
                      </div>
                    </div>
                    <div style={{padding:"10px 14px"}}>
                      {!past?<div style={{fontFamily:"sans-serif",fontSize:12,color:"#555",textAlign:"center",padding:"8px"}}>🔒 Palpites revelados após o início</div>:(
                        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                          {approvedMembers.map(m=>{
                            const gu=getGuessOf(m.uid,selectedBolao?.id,g.id), pts=hasR&&gu?calcPoints(gu,r):null, isMe=m.uid===currentUser.uid;
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

          {/* CLASSIFICAÇÃO */}
          {subScreen==="menu_ranking"&&(
            <div>
              <h2 style={{letterSpacing:5,color:"#ffdf00",marginBottom:14,fontSize:fs(24)}}>🏆 CLASSIFICAÇÃO — {selectedBolao.nome}</h2>
              <div style={{display:"grid",gap:10}}>
                {ranking.map((p,i)=>{
                  const isMe=p.uid===currentUser.uid;
                  return(
                    <div key={p.uid} style={{
                      background:i===0?"linear-gradient(90deg,rgba(255,215,0,.18),transparent)":i===1?"linear-gradient(90deg,rgba(192,192,192,.1),transparent)":i===2?"linear-gradient(90deg,rgba(205,127,50,.1),transparent)":"rgba(255,255,255,.03)",
                      border:`2px solid ${isMe?"#ffdf00":i===0?"rgba(255,215,0,.5)":i===1?"rgba(192,192,192,.3)":i===2?"rgba(205,127,50,.3)":"#1a1a1a"}`,
                      borderRadius:14,padding:"16px",display:"flex",alignItems:"center",gap:14
                    }}>
                      {/* Posição */}
                      <div style={{fontSize:fs(32),width:44,textAlign:"center",flexShrink:0}}>
                        {i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{fontFamily:"sans-serif",fontWeight:900,color:"#666",fontSize:fs(20)}}>{i+1}°</span>}
                      </div>
                      {/* Avatar + nome */}
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{width:fs(36),height:fs(36),borderRadius:"50%",background:avatarColor(p.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(16),fontWeight:700,color:"#fff",flexShrink:0}}>{p.apelido[0].toUpperCase()}</div>
                          <div style={{fontSize:fs(20),letterSpacing:2,color:isMe?"#ffdf00":"#fff"}}>{p.apelido}{isMe&&<span style={{fontSize:fs(12),color:"#ffdf00",marginLeft:6,fontFamily:"sans-serif"}}>← você</span>}</div>
                        </div>
                        <div style={{fontSize:fs(13),color:"#666",fontFamily:"sans-serif"}}>
                          🎯 {p.exact} placar exato · ✅ {p.win} acerto
                        </div>
                      </div>
                      {/* Pontos */}
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:fs(38),color:isMe?"#ffdf00":i===0?"#ffdf00":"#fff",lineHeight:1,fontWeight:900}}>{p.pts}</div>
                        <div style={{fontSize:fs(12),color:"#555",fontFamily:"sans-serif"}}>PTS</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADMIN DO BOLÃO — COMPLETO */}
          {subScreen==="menu_admin"&&(
            <div>
              {/* Desbloqueio */}
              {!adminUnlocked?(
                <div style={{maxWidth:400,margin:"20px auto",background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.3)",borderRadius:14,padding:"28px",textAlign:"center"}}>
                  <div style={{fontSize:fs(44),marginBottom:8}}>🔐</div>
                  <div style={{fontSize:fs(22),letterSpacing:3,color:"#ffdf00",marginBottom:14}}>ACESSO DO ADMINISTRADOR</div>
                  <input type="password" placeholder="Digite a senha do admin" value={adminInput}
                    onChange={e=>setAdminInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&(adminInput===ADMIN_PASS?setAdminUnlocked(true):notify("Senha incorreta","err"))}
                    style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"12px",fontSize:fs(16),fontFamily:"sans-serif",marginBottom:10,textAlign:"center",letterSpacing:4}}/>
                  <button onClick={()=>adminInput===ADMIN_PASS?setAdminUnlocked(true):notify("Senha incorreta","err")}
                    style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"13px",fontSize:fs(17),letterSpacing:3,cursor:"pointer"}}>
                    ENTRAR
                  </button>
                </div>
              ):(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                    <div style={{fontSize:fs(22),letterSpacing:4,color:"#ffdf00"}}>🔐 PAINEL DO ADMINISTRADOR</div>
                    <span style={{background:"#009c3b",color:"#fff",fontFamily:"sans-serif",fontSize:fs(12),padding:"3px 10px",borderRadius:20}}>✅ Ativo</span>
                  </div>

                  {/* ── SEÇÃO 1: PARTICIPANTES ── */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a3a1a",borderRadius:14,padding:"18px",marginBottom:16}}>
                    <div style={{fontSize:fs(18),letterSpacing:3,color:"#ffdf00",marginBottom:14}}>👥 PARTICIPANTES</div>

                    {/* Pendentes */}
                    {getPendingMembers(selectedBolao.id).length>0&&(
                      <div style={{marginBottom:16}}>
                        <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#ffdf00",letterSpacing:1,marginBottom:8}}>⏳ AGUARDANDO APROVAÇÃO ({getPendingMembers(selectedBolao.id).length})</div>
                        {getPendingMembers(selectedBolao.id).map(m=>(
                          <div key={m.uid} style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.2)",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                              <div style={{width:38,height:38,borderRadius:"50%",background:avatarColor(m.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(16),fontWeight:700,color:"#fff",flexShrink:0}}>{m.apelido[0].toUpperCase()}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:fs(16),letterSpacing:1}}>{m.apelido}</div>
                                <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#aaa"}}>👤 {m.nome}</div>
                                {m.whatsapp&&<div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#aaa"}}>📱 <a href={`https://wa.me/55${m.whatsapp?.replace(/\D/g,"")}`} target="_blank" style={{color:"#25d366",textDecoration:"none"}}>{m.whatsapp}</a></div>}
                                {m.email&&<div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#777"}}>✉️ {m.email}</div>}
                              </div>
                              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                <button onClick={()=>approveMember(selectedBolao.id,m.uid)} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:fs(14),fontWeight:700}}>✅ Aprovar</button>
                                <button onClick={()=>rejectMember(selectedBolao.id,m.uid)} style={{background:"#7a1010",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:fs(14),fontWeight:700}}>❌ Rejeitar</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Aprovados */}
                    <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#009c3b",letterSpacing:1,marginBottom:8}}>✅ APROVADOS ({getApprovedMembers(selectedBolao.id).length})</div>
                    <div style={{display:"grid",gap:8}}>
                      {getApprovedMembers(selectedBolao.id).map(m=>(
                        <div key={m.uid} style={{background:"rgba(0,156,59,.06)",border:"1px solid rgba(0,156,59,.2)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <div style={{width:34,height:34,borderRadius:"50%",background:avatarColor(m.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(15),fontWeight:700,color:"#fff",flexShrink:0}}>{m.apelido[0].toUpperCase()}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:fs(15),letterSpacing:1}}>{m.apelido}</div>
                            <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#777"}}>
                              👤 {m.nome}
                              {m.whatsapp&&<> · 📱 <a href={`https://wa.me/55${m.whatsapp?.replace(/\D/g,"")}`} target="_blank" style={{color:"#25d366",textDecoration:"none"}}>{m.whatsapp}</a></>}
                            </div>
                          </div>
                          <button onClick={()=>removeMember(selectedBolao.id,m.uid)}
                            style={{background:"rgba(120,16,16,.6)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:fs(12),fontFamily:"sans-serif"}}>
                            🗑️ Remover
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar participante manualmente */}
                    <div style={{marginTop:16,borderTop:"1px solid #1a1a1a",paddingTop:14}}>
                      <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#888",letterSpacing:1,marginBottom:8}}>➕ ADICIONAR PARTICIPANTE MANUALMENTE</div>
                      <AddMemberForm bolaoId={selectedBolao.id} db={db} members={members} notify={notify} approveMember={approveMember}/>
                    </div>
                  </div>

                  {/* ── SEÇÃO 2: RESULTADOS ── */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a3a1a",borderRadius:14,padding:"18px",marginBottom:16}}>
                    <div style={{fontSize:fs(18),letterSpacing:3,color:"#ffdf00",marginBottom:6}}>⚽ RESULTADOS DOS JOGOS</div>
                    <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#888",marginBottom:14}}>
                      Insira manualmente ou use a API automática abaixo.
                    </div>
                    <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                      <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)}
                        style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",padding:"8px 12px",borderRadius:6,fontSize:fs(13),fontFamily:"sans-serif",cursor:"pointer"}}>
                        {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    {filteredGames().map(g=><GameRow key={g.id} g={g} mode="admin"/>)}
                  </div>

                  {/* ── SEÇÃO 3: API AUTOMÁTICA ── */}
                  <div style={{background:"rgba(0,156,59,.07)",border:"1px solid rgba(0,156,59,.3)",borderRadius:14,padding:"18px",marginBottom:16}}>
                    <div style={{fontSize:fs(18),letterSpacing:3,color:"#009c3b",marginBottom:6}}>🌐 ATUALIZAÇÃO AUTOMÁTICA DE RESULTADOS</div>
                    <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#aaa",lineHeight:1.7,marginBottom:12}}>
                      Cadastre-se gratuitamente em <strong style={{color:"#fff"}}>football-data.org</strong>, copie sua chave e cole abaixo. O sistema buscará os resultados automaticamente a cada 5 min nos dias de jogo.
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:8}}>
                      <input type="text" placeholder="Cole sua chave de API aqui" value={apiKey}
                        onChange={e=>{setApiKey(e.target.value);localStorage.setItem("bg26_apikey",e.target.value);}}
                        style={{flex:1,minWidth:180,background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"10px 12px",fontSize:fs(13),fontFamily:"monospace"}}/>
                      <button onClick={fetchLive} disabled={liveFetching}
                        style={{background:liveFetching?"#1a1a1a":"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:fs(14),fontWeight:700}}>
                        {liveFetching?"⏳ Buscando...":"🔄 Atualizar Agora"}
                      </button>
                    </div>
                    {lastUpdate&&<div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#666"}}>🕐 Última atualização: {lastUpdate}</div>}
                  </div>

                  {/* ── SEÇÃO 4: AVISOS ── */}
                  <AvisoForm bolaoId={selectedBolao.id} db={db} notify={notify} fs={fs}/>

                  {/* ── SEÇÃO 5: REGRAS ── */}
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a1a1a",borderRadius:14,padding:"18px",marginBottom:16}}>
                    <div style={{fontSize:fs(18),letterSpacing:3,color:"#ffdf00",marginBottom:12}}>📖 REGRAS DO BOLÃO</div>
                    <div style={{display:"grid",gap:10}}>
                      {[
                        {pts:"3 pts",c:"#009c3b",i:"🎯",t:"Placar Exato",d:"Acertou o placar correto dos dois lados."},
                        {pts:"1 pt", c:"#c8a200",i:"✅",t:"Acertou o Vencedor/Empate",d:"Acertou quem ganha ou empate, mas errou o placar."},
                        {pts:"0 pts",c:"#5a1010",i:"❌",t:"Errou",d:"Errou quem vence."},
                      ].map(r=>(
                        <div key={r.pts} style={{display:"flex",gap:12,alignItems:"center",background:"rgba(255,255,255,.03)",borderRadius:10,padding:"12px 14px"}}>
                          <div style={{width:42,height:42,borderRadius:"50%",background:r.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(20),flexShrink:0}}>{r.i}</div>
                          <div>
                            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                              <span style={{fontSize:fs(16),letterSpacing:1}}>{r.t}</span>
                              <span style={{background:r.c,color:"#fff",padding:"1px 8px",borderRadius:20,fontFamily:"sans-serif",fontSize:fs(11),fontWeight:700}}>{r.pts}</span>
                            </div>
                            <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#888"}}>{r.d}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{background:"rgba(255,223,0,.06)",border:"1px solid rgba(255,223,0,.2)",borderRadius:10,padding:"12px 14px",fontFamily:"sans-serif",fontSize:fs(12),color:"#ccc",lineHeight:1.8}}>
                        <strong style={{color:"#ffdf00"}}>🏆 Desempate:</strong> 1º Mais placares exatos · 2º Mais acertos · 3º Sorteio
                      </div>
                    </div>
                  </div>

                  {/* ── SEÇÃO 6: CONFIGURAÇÕES DO BOLÃO ── */}
                  <div style={{background:"rgba(0,39,118,.1)",border:"1px solid rgba(0,39,118,.4)",borderRadius:14,padding:"18px",marginBottom:16}}>
                    <div style={{fontSize:fs(18),letterSpacing:3,color:"#aaaaff",marginBottom:12}}>⚙️ CONFIGURAÇÕES DO BOLÃO</div>
                    <BolaoConfigForm bolao={selectedBolao} db={db} notify={notify} fs={fs}/>
                  </div>

                </div>
              )}
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

// ── Componente: Painel Admin Global Completo ──────────────────────────────────
function AdminGlobalPanel({
  db, boloes, members, results, notify,
  apiKey, setApiKey, fetchLive, liveFetching, lastUpdate,
  newBolaoNome, setNewBolaoNome, newBolaoDesc, setNewBolaoDesc,
  createBolao, approveMember, rejectMember, removeMember,
  getMembersOfBolao, getApprovedMembers, getPendingMembers,
  avatarColor, onVoltar
}) {
  const [selectedBolaoId, setSelectedBolaoId] = useState(Object.keys(boloes)[0]||"");
  const [adminTab, setAdminTab] = useState("boloes"); // boloes | participantes | resultados | api | configuracoes
  const [editMember, setEditMember] = useState(null);
  const [newMemberNome, setNewMemberNome] = useState("");
  const [newMemberApelido, setNewMemberApelido] = useState("");
  const [newMemberWa, setNewMemberWa] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [filterResultGroup, setFilterResultGroup] = useState("Todos");

  const bolaoAtual = boloes[selectedBolaoId];
  const membrosAtuais = getMembersOfBolao(selectedBolaoId);
  const aprovados = getApprovedMembers(selectedBolaoId);
  const pendentes = getPendingMembers(selectedBolaoId);

  const FILTER_OPTS_R = ["Todos","Grupo A","Grupo B","Grupo C","Grupo D","Grupo E","Grupo F","Grupo G","Grupo H","Grupo I","Grupo J","Grupo K","Grupo L","32 Avos","Oitavas","Quartas","Semifinal","3º Lugar","Final"];

  const jogosFiltrados = SCHEDULE.filter(g=>{
    if(filterResultGroup==="Todos") return true;
    if(filterResultGroup==="32 Avos") return g.group==="32avos";
    if(["Oitavas","Quartas","Semifinal","3º Lugar","Final"].includes(filterResultGroup)) return g.group===filterResultGroup;
    return "Grupo "+g.group===filterResultGroup;
  });

  async function saveResultAdmin(gameId, side, val) {
    await set(dbRef(db, `results/${gameId}/${side}`), val);
  }

  async function addMember() {
    if(!newMemberNome.trim()||!newMemberApelido.trim()){notify("Nome e apelido obrigatórios","err");return;}
    const uid = newMemberApelido.trim().replace(/[.#$[\]/\s]/g,"_");
    if(members[selectedBolaoId]?.[uid]){notify("Apelido já existe","err");return;}
    await set(dbRef(db,`members/${selectedBolaoId}/${uid}`),{
      nome:newMemberNome.trim(),apelido:newMemberApelido.trim(),
      whatsapp:newMemberWa.trim(),email:newMemberEmail.trim(),
      status:"aprovado",createdAt:new Date().toISOString()
    });
    setNewMemberNome("");setNewMemberApelido("");setNewMemberWa("");setNewMemberEmail("");
    notify(`✅ ${newMemberApelido} adicionado!`);
  }

  async function saveMemberEdit(uid) {
    await update(dbRef(db,`members/${selectedBolaoId}/${uid}`),editMember);
    setEditMember(null);
    notify("✅ Participante atualizado!");
  }

  async function renameBolao(bid, nomeAtual) {
    const novoNome = window.prompt("Novo nome do bolão:", nomeAtual);
    if(novoNome&&novoNome.trim()){
      await update(dbRef(db,`boloes/${bid}`),{nome:novoNome.trim()});
      notify(`✅ Renomeado para "${novoNome.trim()}"`);
    }
  }

  async function deleteBolao(bid, nome) {
    if(window.confirm(`Excluir o bolão "${nome}"?\n\nTodos os dados serão perdidos permanentemente.`)){
      await remove(dbRef(db,`boloes/${bid}`));
      notify(`🗑️ Bolão "${nome}" excluído.`);
      const restantes = Object.keys(boloes).filter(k=>k!==bid);
      setSelectedBolaoId(restantes[0]||"");
    }
  }

  const tabStyle = (t) => ({
    background:adminTab===t?"#ffdf00":"rgba(255,255,255,.06)",
    color:adminTab===t?"#000":"#aaa",border:"none",cursor:"pointer",
    padding:"9px 14px",fontSize:12,fontWeight:700,fontFamily:"sans-serif",
    letterSpacing:1,whiteSpace:"nowrap",transition:".15s",borderRadius:6
  });

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onVoltar} style={{background:"transparent",color:"#888",border:"1px solid #333",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>← Voltar</button>
        <div style={{fontSize:20,letterSpacing:4,color:"#ffdf00"}}>🔐 PAINEL DO ADMINISTRADOR</div>
        <span style={{background:"#009c3b",color:"#fff",fontFamily:"sans-serif",fontSize:11,padding:"2px 10px",borderRadius:20,fontWeight:700}}>✅ Ativo</span>
      </div>

      {/* Abas do painel */}
      <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",flexWrap:"wrap"}}>
        {[
          {id:"boloes",     label:"🏆 Bolões"},
          {id:"participantes", label:"👥 Participantes"},
          {id:"resultados", label:"⚽ Resultados"},
          {id:"api",        label:"🌐 API Auto"},
          {id:"configuracoes", label:"⚙️ Configurações"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setAdminTab(t.id)} style={tabStyle(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── ABA: BOLÕES ── */}
      {adminTab==="boloes"&&(
        <div>
          {/* Criar novo */}
          <div style={{background:"rgba(0,156,59,.08)",border:"1px solid rgba(0,156,59,.3)",borderRadius:12,padding:"18px",marginBottom:20}}>
            <div style={{fontSize:16,letterSpacing:3,color:"#009c3b",marginBottom:12}}>➕ CRIAR NOVO BOLÃO</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <input placeholder="Nome do bolão" value={newBolaoNome} onChange={e=>setNewBolaoNome(e.target.value)}
                style={{flex:1,minWidth:180,background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"sans-serif"}}/>
              <input placeholder="Descrição (opcional)" value={newBolaoDesc} onChange={e=>setNewBolaoDesc(e.target.value)}
                style={{flex:1,minWidth:180,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"sans-serif"}}/>
              <button onClick={createBolao} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:14,fontWeight:700}}>Criar</button>
            </div>
          </div>

          {/* Lista de bolões */}
          {Object.entries(boloes).map(([bid,b])=>{
            const ap=getApprovedMembers(bid).length;
            const pe=getPendingMembers(bid).length;
            return(
              <div key={bid} style={{background:"rgba(255,255,255,.03)",border:`2px solid ${selectedBolaoId===bid?"#ffdf00":"#1a2a1a"}`,borderRadius:12,marginBottom:12,overflow:"hidden",cursor:"pointer"}}
                onClick={()=>setSelectedBolaoId(bid)}>
                <div style={{background:selectedBolaoId===bid?"linear-gradient(90deg,#7a5000,#c8a200)":"linear-gradient(90deg,#004d22,#009c3b)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:18,letterSpacing:2}}>{b.nome}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2}}>{b.descricao} · ✅ {ap} aprovados · ⏳ {pe} pendentes · {b.ativo?"🟢 Ativo":"🔴 Inativo"}</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={e=>{e.stopPropagation();renameBolao(bid,b.nome);}}
                      style={{background:"rgba(255,255,255,.2)",color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"sans-serif"}}>✏️ Renomear</button>
                    <button onClick={e=>{e.stopPropagation();deleteBolao(bid,b.nome);}}
                      style={{background:"rgba(120,16,16,.7)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"sans-serif"}}>🗑️ Excluir</button>
                  </div>
                </div>
              </div>
            );
          })}
          {Object.keys(boloes).length===0&&<div style={{textAlign:"center",padding:"40px",fontFamily:"sans-serif",color:"#555"}}>Nenhum bolão criado ainda.</div>}
        </div>
      )}

      {/* ── ABA: PARTICIPANTES ── */}
      {adminTab==="participantes"&&(
        <div>
          {/* Seletor de bolão */}
          <div style={{marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>BOLÃO:</span>
            <select value={selectedBolaoId} onChange={e=>setSelectedBolaoId(e.target.value)}
              style={{background:"#050d0a",color:"#ffdf00",border:"2px solid #009c3b",borderRadius:6,padding:"7px 12px",fontSize:14,cursor:"pointer"}}>
              {Object.entries(boloes).map(([bid,b])=><option key={bid} value={bid}>{b.nome}</option>)}
            </select>
          </div>

          {/* Pendentes */}
          {pendentes.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#ffdf00",letterSpacing:1,marginBottom:8}}>⏳ AGUARDANDO APROVAÇÃO ({pendentes.length})</div>
              {pendentes.map(m=>(
                <div key={m.uid} style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.2)",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:avatarColor(m.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0}}>{m.apelido[0].toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,letterSpacing:1}}>{m.apelido}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>👤 {m.nome} · 📱 <a href={`https://wa.me/55${m.whatsapp?.replace(/\D/g,"")}`} target="_blank" style={{color:"#25d366",textDecoration:"none"}}>{m.whatsapp}</a></div>
                    {m.email&&<div style={{fontFamily:"sans-serif",fontSize:11,color:"#666"}}>✉️ {m.email}</div>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>approveMember(selectedBolaoId,m.uid)} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>✅ Aprovar</button>
                    <button onClick={()=>rejectMember(selectedBolaoId,m.uid)} style={{background:"#7a1010",color:"#fff",border:"none",borderRadius:6,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700}}>❌ Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aprovados */}
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#009c3b",letterSpacing:1,marginBottom:8}}>✅ APROVADOS ({aprovados.length})</div>
            {aprovados.map(m=>(
              <div key={m.uid} style={{background:"rgba(0,156,59,.06)",border:"1px solid rgba(0,156,59,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                {editMember?.uid===m.uid?(
                  <div style={{display:"grid",gap:8}}>
                    {[
                      {label:"Nome",val:"nome"},{label:"Apelido",val:"apelido"},
                      {label:"WhatsApp",val:"whatsapp"},{label:"Email",val:"email"}
                    ].map(f=>(
                      <div key={f.val}>
                        <div style={{fontFamily:"sans-serif",fontSize:10,color:"#888",marginBottom:3}}>{f.label}</div>
                        <input value={editMember[f.val]||""} onChange={e=>setEditMember(p=>({...p,[f.val]:e.target.value}))}
                          style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #009c3b",borderRadius:6,padding:"7px 10px",fontSize:13,fontFamily:"sans-serif"}}/>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>saveMemberEdit(m.uid)} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>💾 Salvar</button>
                      <button onClick={()=>setEditMember(null)} style={{background:"#333",color:"#aaa",border:"none",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontSize:13,fontFamily:"sans-serif"}}>Cancelar</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:avatarColor(m.apelido),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{m.apelido[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,letterSpacing:1}}>{m.apelido}</div>
                      <div style={{fontFamily:"sans-serif",fontSize:11,color:"#777"}}>
                        👤 {m.nome}
                        {m.whatsapp&&<> · 📱 <a href={`https://wa.me/55${m.whatsapp?.replace(/\D/g,"")}`} target="_blank" style={{color:"#25d366",textDecoration:"none"}}>{m.whatsapp}</a></>}
                        {m.email&&<> · ✉️ {m.email}</>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setEditMember({...m})} style={{background:"rgba(255,223,0,.15)",color:"#ffdf00",border:"1px solid rgba(255,223,0,.3)",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>✏️ Editar</button>
                      <button onClick={()=>removeMember(selectedBolaoId,m.uid)} style={{background:"rgba(120,16,16,.3)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Adicionar novo participante */}
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a2a1a",borderRadius:12,padding:"16px"}}>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",letterSpacing:1,marginBottom:12}}>➕ ADICIONAR PARTICIPANTE MANUALMENTE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              {[
                {ph:"Nome completo *",val:newMemberNome,set:setNewMemberNome},
                {ph:"Apelido no bolão *",val:newMemberApelido,set:setNewMemberApelido},
                {ph:"WhatsApp (opcional)",val:newMemberWa,set:setNewMemberWa},
                {ph:"Email (opcional)",val:newMemberEmail,set:setNewMemberEmail},
              ].map(f=>(
                <input key={f.ph} type="text" placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}
                  style={{background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"sans-serif"}}/>
              ))}
            </div>
            <button onClick={addMember} style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontSize:14,fontWeight:700}}>
              ➕ Adicionar e Aprovar
            </button>
          </div>
        </div>
      )}

      {/* ── ABA: RESULTADOS ── */}
      {adminTab==="resultados"&&(
        <div>
          <div style={{marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>BOLÃO:</span>
            <select value={selectedBolaoId} onChange={e=>setSelectedBolaoId(e.target.value)}
              style={{background:"#050d0a",color:"#ffdf00",border:"2px solid #009c3b",borderRadius:6,padding:"7px 12px",fontSize:14,cursor:"pointer"}}>
              {Object.entries(boloes).map(([bid,b])=><option key={bid} value={bid}>{b.nome}</option>)}
            </select>
            <select value={filterResultGroup} onChange={e=>setFilterResultGroup(e.target.value)}
              style={{background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:6,padding:"7px 10px",fontSize:12,fontFamily:"sans-serif",cursor:"pointer"}}>
              {FILTER_OPTS_R.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:14}}>
            📝 Insira o placar real de cada jogo. Os pontos são calculados automaticamente.
          </div>
          {jogosFiltrados.map(g=>{
            const r = results[g.id]||{};
            const hasR = r.home!==undefined&&r.home!=="";
            return(
              <div key={g.id} style={{background:hasR?"rgba(0,156,59,.07)":"rgba(255,255,255,.02)",border:`1px solid ${hasR?"#009c3b":"#1a2a1a"}`,borderRadius:12,overflow:"hidden",marginBottom:8}}>
                <div style={{background:"rgba(255,255,255,.05)",borderBottom:`1px solid ${hasR?"#009c3b":"#1a2a1a"}`,padding:"7px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                  <div style={{fontFamily:"sans-serif",fontSize:12,display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{color:"#ffdf00",fontWeight:700}}>{new Date(g.date+":00-03:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</span>
                    <span style={{fontWeight:700}}>{new Date(g.date+":00-03:00").toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}h BRT</span>
                    <span style={{color:"#666"}}>📍{g.city}</span>
                  </div>
                  <span style={{fontFamily:"sans-serif",fontSize:10,background:"#002776",color:"#aaa",padding:"2px 8px",borderRadius:20}}>
                    {g.knockout?(g.group):`GR.${g.group}`}
                  </span>
                </div>
                <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
                  <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:14,fontWeight:700,color:"#fff"}}>{g.home}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min="0" max="20" value={r.home??""} onChange={e=>saveResultAdmin(g.id,"home",e.target.value)}
                      placeholder="–"
                      style={{width:52,height:52,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:8,fontSize:22,fontFamily:"monospace"}}/>
                    <span style={{color:"#fff",fontSize:20,fontWeight:900}}>×</span>
                    <input type="number" min="0" max="20" value={r.away??""} onChange={e=>saveResultAdmin(g.id,"away",e.target.value)}
                      placeholder="–"
                      style={{width:52,height:52,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:8,fontSize:22,fontFamily:"monospace"}}/>
                  </div>
                  <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:14,fontWeight:700,color:"#fff"}}>{g.away}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ABA: API ── */}
      {adminTab==="api"&&(
        <div>
          <div style={{background:"rgba(0,156,59,.08)",border:"1px solid rgba(0,156,59,.3)",borderRadius:12,padding:"20px",marginBottom:16}}>
            <div style={{fontSize:18,letterSpacing:3,color:"#009c3b",marginBottom:8}}>🌐 ATUALIZAÇÃO AUTOMÁTICA DE RESULTADOS</div>
            <p style={{fontFamily:"sans-serif",fontSize:13,color:"#aaa",lineHeight:1.8,marginBottom:14}}>
              Cadastre-se gratuitamente em <strong style={{color:"#fff"}}>football-data.org</strong>, copie sua chave e cole abaixo.<br/>
              O sistema buscará os resultados automaticamente a cada 5 minutos nos dias de jogo.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
              <input type="text" placeholder="Cole sua chave de API aqui" value={apiKey}
                onChange={e=>{setApiKey(e.target.value);localStorage.setItem("bg26_apikey",e.target.value);}}
                style={{flex:1,minWidth:200,background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"10px 14px",fontSize:14,fontFamily:"monospace"}}/>
              <button onClick={fetchLive} disabled={liveFetching}
                style={{background:liveFetching?"#1a1a1a":"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:14,fontWeight:700}}>
                {liveFetching?"⏳ Buscando...":"🔄 Atualizar Agora"}
              </button>
            </div>
            {lastUpdate&&<div style={{fontFamily:"sans-serif",fontSize:12,color:"#666"}}>🕐 Última atualização: {lastUpdate}</div>}
          </div>
          <div style={{background:"rgba(255,223,0,.06)",border:"1px solid rgba(255,223,0,.2)",borderRadius:12,padding:"16px",fontFamily:"sans-serif",fontSize:13,color:"#ccc",lineHeight:2}}>
            <strong style={{color:"#ffdf00"}}>📋 Passo a passo:</strong><br/>
            1. Acesse <strong style={{color:"#fff"}}>football-data.org</strong> e crie uma conta gratuita<br/>
            2. Copie sua chave de API no painel do site<br/>
            3. Cole a chave no campo acima<br/>
            4. Clique em "Atualizar Agora" para testar<br/>
            5. A partir daí o sistema atualiza automaticamente a cada 5 min nos dias de jogo
          </div>
        </div>
      )}

      {/* ── ABA: CONFIGURAÇÕES ── */}
      {adminTab==="configuracoes"&&(
        <div>
          <div style={{marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>BOLÃO:</span>
            <select value={selectedBolaoId} onChange={e=>setSelectedBolaoId(e.target.value)}
              style={{background:"#050d0a",color:"#ffdf00",border:"2px solid #009c3b",borderRadius:6,padding:"7px 12px",fontSize:14,cursor:"pointer"}}>
              {Object.entries(boloes).map(([bid,b])=><option key={bid} value={bid}>{b.nome}</option>)}
            </select>
          </div>
          {bolaoAtual&&<BolaoConfigForm bolao={{id:selectedBolaoId,...bolaoAtual}} db={db} notify={notify}/>}
        </div>
      )}
    </div>
  );
}

// ── Componente: Adicionar membro manualmente ──────────────────────────────────
function AddMemberForm({bolaoId, db, members, notify, approveMember}) {
  const [nome, setNome]       = useState("");
  const [apelido, setApelido] = useState("");
  const [wa, setWa]           = useState("");
  const [email, setEmail]     = useState("");
  const [err, setErr]         = useState("");

  async function handleAdd() {
    setErr("");
    if (!nome.trim()||!apelido.trim()) { setErr("Nome e apelido são obrigatórios."); return; }
    const uid = apelido.trim().replace(/[.#$[\]/\s]/g,"_");
    if (members[bolaoId]?.[uid]) { setErr("Este apelido já existe."); return; }
    try {
      await set(dbRef(db, `members/${bolaoId}/${uid}`), {
        nome:nome.trim(), apelido:apelido.trim(),
        whatsapp:wa.trim(), email:email.trim().toLowerCase(),
        status:"pendente", createdAt:new Date().toISOString(),
      });
      await approveMember(bolaoId, uid);
      setNome(""); setApelido(""); setWa(""); setEmail("");
      notify(`✅ ${apelido} adicionado e aprovado!`);
    } catch { setErr("Erro ao adicionar."); }
  }

  return (
    <div style={{display:"grid",gap:8}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {ph:"Nome completo",val:nome,set:setNome},
          {ph:"Apelido no bolão",val:apelido,set:setApelido},
          {ph:"WhatsApp (opcional)",val:wa,set:setWa},
          {ph:"Email (opcional)",val:email,set:setEmail},
        ].map(f=>(
          <input key={f.ph} type="text" placeholder={f.ph} value={f.val}
            onChange={e=>f.set(e.target.value)}
            style={{background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"sans-serif"}}/>
        ))}
      </div>
      {err&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif"}}>{err}</div>}
      <button onClick={handleAdd}
        style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"9px",cursor:"pointer",fontSize:14,fontWeight:700}}>
        ➕ Adicionar e Aprovar Direto
      </button>
    </div>
  );
}

// ── Componente: Avisos do bolão ───────────────────────────────────────────────
function AvisoForm({bolaoId, db, notify, fs}) {
  const [texto, setTexto] = useState("");
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    const r = dbRef(db, `avisos/${bolaoId}`);
    onValue(r, s => {
      const val = s.val()||{};
      setAvisos(Object.entries(val).map(([id,a])=>({id,...a})).sort((a,b)=>b.ts-a.ts));
    });
    return () => off(r);
  }, [bolaoId, db]);

  async function enviar() {
    if (!texto.trim()) return;
    await push(dbRef(db, `avisos/${bolaoId}`), {
      texto:texto.trim(), ts:Date.now(),
      data:new Date().toLocaleDateString("pt-BR")
    });
    setTexto("");
    notify("📢 Aviso enviado para todos!");
  }

  async function excluir(id) {
    await remove(dbRef(db, `avisos/${bolaoId}/${id}`));
    notify("Aviso removido.");
  }

  return (
    <div style={{background:"rgba(0,85,128,.1)",border:"1px solid rgba(0,85,128,.4)",borderRadius:14,padding:"18px",marginBottom:16}}>
      <div style={{fontSize:fs?fs(18):18,letterSpacing:3,color:"#55aaff",marginBottom:12}}>📢 AVISOS PARA O BOLÃO</div>
      <textarea placeholder="Escreva um aviso para todos os participantes..." value={texto}
        onChange={e=>setTexto(e.target.value)} rows={3}
        style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",borderRadius:8,padding:"10px",fontSize:13,fontFamily:"sans-serif",resize:"vertical",marginBottom:8}}/>
      <button onClick={enviar}
        style={{background:"linear-gradient(135deg,#005580,#003355)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontSize:14,fontWeight:700,marginBottom:16}}>
        📢 Enviar Aviso
      </button>
      {avisos.length>0&&(
        <div>
          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#666",letterSpacing:1,marginBottom:8}}>AVISOS ENVIADOS:</div>
          {avisos.map(a=>(
            <div key={a.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid #1a2a3a",borderRadius:8,padding:"10px 12px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"sans-serif",fontSize:13,color:"#ddd",lineHeight:1.6}}>{a.texto}</div>
                <div style={{fontFamily:"sans-serif",fontSize:10,color:"#555",marginTop:4}}>{a.data}</div>
              </div>
              <button onClick={()=>excluir(a.id)} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontSize:16,flexShrink:0}}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente: Configurações do bolão ────────────────────────────────────────
function BolaoConfigForm({bolao, db, notify, fs}) {
  const [nome,    setNome]    = useState(bolao?.nome||"");
  const [desc,    setDesc]    = useState(bolao?.descricao||"");
  const [ativo,   setAtivo]   = useState(bolao?.ativo!==false);
  const [confirm, setConfirm] = useState(false);

  async function salvar() {
    if (!nome.trim()) { notify("Digite o nome do bolão.","err"); return; }
    await update(dbRef(db, `boloes/${bolao.id}`), {
      nome:nome.trim(), descricao:desc.trim(), ativo
    });
    notify("✅ Configurações salvas!");
  }

  async function excluir() {
    await remove(dbRef(db, `boloes/${bolao.id}`));
    notify("🗑️ Bolão excluído.");
    window.location.reload();
  }

  const fSize = fs || (b=>b);

  return (
    <div style={{display:"grid",gap:12}}>
      <div>
        <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:5}}>NOME DO BOLÃO</div>
        <input type="text" value={nome} onChange={e=>setNome(e.target.value)}
          style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #2a2a6a",
            borderRadius:8,padding:"11px 12px",fontSize:fSize(15),fontFamily:"sans-serif"}}/>
      </div>
      <div>
        <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:5}}>DESCRIÇÃO</div>
        <input type="text" value={desc} onChange={e=>setDesc(e.target.value)}
          style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a2a4a",
            borderRadius:8,padding:"11px 12px",fontSize:fSize(14),fontFamily:"sans-serif"}}/>
      </div>
      <div>
        <label style={{fontFamily:"sans-serif",fontSize:fSize(13),color:"#aaa",
          display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <input type="checkbox" checked={ativo} onChange={e=>setAtivo(e.target.checked)}
            style={{width:18,height:18,cursor:"pointer"}}/>
          Bolão ativo (visível para novos participantes)
        </label>
      </div>
      <button onClick={salvar}
        style={{background:"linear-gradient(135deg,#1a1a6a,#2a2aaa)",color:"#fff",
          border:"none",borderRadius:8,padding:"11px",cursor:"pointer",
          fontSize:fSize(15),fontWeight:700,letterSpacing:1}}>
        💾 Salvar Alterações
      </button>

      {/* Excluir bolão */}
      <div style={{borderTop:"1px solid #2a1010",paddingTop:12,marginTop:4}}>
        <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:8}}>ZONA DE PERIGO</div>
        {!confirm ? (
          <button onClick={()=>setConfirm(true)}
            style={{background:"rgba(120,16,16,.3)",color:"#ffaaaa",border:"1px solid #5a1010",
              borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:fSize(13),
              fontFamily:"sans-serif",fontWeight:700,width:"100%"}}>
            🗑️ Excluir este Bolão
          </button>
        ) : (
          <div style={{background:"rgba(120,16,16,.2)",border:"1px solid #7a1010",
            borderRadius:8,padding:"14px",textAlign:"center"}}>
            <div style={{fontFamily:"sans-serif",fontSize:fSize(13),color:"#ffaaaa",marginBottom:12,lineHeight:1.6}}>
              ⚠️ Tem certeza? Esta ação irá <strong>excluir permanentemente</strong> o bolão e todos os dados associados.
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={excluir}
                style={{background:"#7a1010",color:"#fff",border:"none",borderRadius:7,
                  padding:"9px 20px",cursor:"pointer",fontSize:fSize(13),fontWeight:700}}>
                ✅ Sim, excluir
              </button>
              <button onClick={()=>setConfirm(false)}
                style={{background:"#2a2a2a",color:"#aaa",border:"1px solid #444",borderRadius:7,
                  padding:"9px 20px",cursor:"pointer",fontSize:fSize(13),fontFamily:"sans-serif"}}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
