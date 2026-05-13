import { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref as dbRef, set, get, onValue, off } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ══════════════════════════════════════════════════════════════════════════════
// 🔥 FIREBASE CONFIG — substitua pelos dados do seu projeto Firebase
// ══════════════════════════════════════════════════════════════════════════════
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

// ──────────────────────────────────────────────────────────────────────────────
// DADOS E CONSTANTES
// ──────────────────────────────────────────────────────────────────────────────
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
const ADMIN_PASS = "copa2026";

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
  // 32 AVOS
  {id:73,  home:"2º A", away:"2º B",       group:"32avos",   date:"2026-06-28T16:00", city:"Los Angeles",      knockout:true},
  {id:74,  home:"1º E", away:"3º ABCDF",   group:"32avos",   date:"2026-06-29T17:30", city:"Boston",           knockout:true},
  {id:75,  home:"1º F", away:"2º C",       group:"32avos",   date:"2026-06-29T22:00", city:"Monterrey",        knockout:true},
  {id:76,  home:"1º C", away:"2º F",       group:"32avos",   date:"2026-06-29T14:00", city:"Houston",          knockout:true},
  {id:77,  home:"1º I", away:"3º CDFGH",   group:"32avos",   date:"2026-06-30T18:00", city:"Nova York",        knockout:true},
  {id:78,  home:"2º E", away:"2º I",       group:"32avos",   date:"2026-06-30T14:00", city:"Dallas",           knockout:true},
  {id:79,  home:"1º A", away:"3º CEFHI",   group:"32avos",   date:"2026-06-30T22:00", city:"Cidade do México", knockout:true},
  {id:80,  home:"1º L", away:"3º EHIJK",   group:"32avos",   date:"2026-07-01T13:00", city:"Atlanta",          knockout:true},
  {id:81,  home:"1º D", away:"3º BEFIJ",   group:"32avos",   date:"2026-07-01T21:00", city:"São Francisco",    knockout:true},
  {id:82,  home:"1º G", away:"3º AEHIJ",   group:"32avos",   date:"2026-07-01T17:00", city:"Seattle",          knockout:true},
  {id:83,  home:"2º K", away:"2º L",       group:"32avos",   date:"2026-07-02T20:00", city:"Toronto",          knockout:true},
  {id:84,  home:"1º H", away:"2º J",       group:"32avos",   date:"2026-07-02T16:00", city:"Los Angeles",      knockout:true},
  {id:85,  home:"1º B", away:"3º EFGIJ",   group:"32avos",   date:"2026-07-02T00:00", city:"Vancouver",        knockout:true},
  {id:86,  home:"1º J", away:"2º H",       group:"32avos",   date:"2026-07-03T17:00", city:"Atlanta",          knockout:true},
  {id:87,  home:"1º K", away:"3º DEIJL",   group:"32avos",   date:"2026-07-03T22:30", city:"Kansas City",      knockout:true},
  {id:88,  home:"2º D", away:"2º G",       group:"32avos",   date:"2026-07-03T15:00", city:"Dallas",           knockout:true},
  // OITAVAS
  {id:89,  home:"W74",  away:"W77",         group:"Oitavas",  date:"2026-07-04T18:00", city:"Filadélfia",       knockout:true},
  {id:90,  home:"W73",  away:"W75",         group:"Oitavas",  date:"2026-07-04T14:00", city:"Houston",          knockout:true},
  {id:91,  home:"W76",  away:"W78",         group:"Oitavas",  date:"2026-07-05T17:00", city:"Nova York",        knockout:true},
  {id:92,  home:"W79",  away:"W80",         group:"Oitavas",  date:"2026-07-05T21:00", city:"Cidade do México", knockout:true},
  {id:93,  home:"W83",  away:"W84",         group:"Oitavas",  date:"2026-07-06T15:00", city:"Dallas",           knockout:true},
  {id:94,  home:"W81",  away:"W82",         group:"Oitavas",  date:"2026-07-06T20:00", city:"Seattle",          knockout:true},
  {id:95,  home:"W86",  away:"W88",         group:"Oitavas",  date:"2026-07-07T13:00", city:"Atlanta",          knockout:true},
  {id:96,  home:"W85",  away:"W87",         group:"Oitavas",  date:"2026-07-07T17:00", city:"Vancouver",        knockout:true},
  // QUARTAS
  {id:97,  home:"W89",  away:"W90",         group:"Quartas",  date:"2026-07-09T17:00", city:"Boston",           knockout:true},
  {id:98,  home:"W93",  away:"W94",         group:"Quartas",  date:"2026-07-10T16:00", city:"Los Angeles",      knockout:true},
  {id:99,  home:"W91",  away:"W92",         group:"Quartas",  date:"2026-07-11T18:00", city:"Miami",            knockout:true},
  {id:100, home:"W95",  away:"W96",         group:"Quartas",  date:"2026-07-11T21:00", city:"Kansas City",      knockout:true},
  // SEMIS
  {id:101, home:"W97",  away:"W98",         group:"Semifinal",date:"2026-07-14T16:00", city:"Dallas",           knockout:true},
  {id:102, home:"W99",  away:"W100",        group:"Semifinal",date:"2026-07-15T16:00", city:"Dallas",           knockout:true},
  // 3º LUGAR
  {id:103, home:"L101", away:"L102",        group:"3º Lugar", date:"2026-07-18T18:00", city:"Miami",            knockout:true},
  // FINAL
  {id:104, home:"W101", away:"W102",        group:"Final",    date:"2026-07-19T16:00", city:"Nova York",        knockout:true},
];

const PHASE_LABEL = {
  "32avos":"32 AVOS DE FINAL","Oitavas":"OITAVAS DE FINAL",
  "Quartas":"QUARTAS DE FINAL","Semifinal":"SEMIFINAIS",
  "3º Lugar":"🥉 TERCEIRO LUGAR","Final":"🏆 GRANDE FINAL"
};

// ──────────────────────────────────────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────────────────────────────────────
const fmtDate = iso => new Date(iso+":00-03:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(".","");
const fmtTime = iso => new Date(iso+":00-03:00").toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+"h";
const isPast  = iso => new Date(iso+":00-03:00") < new Date();
const isToday = iso => { const d=new Date(iso+":00-03:00"),n=new Date(); return d.toDateString()===n.toDateString(); };

function calcPoints(guess, result) {
  if (!guess||!result) return null;
  const gh=parseInt(guess.home),ga=parseInt(guess.away);
  const rh=parseInt(result.home),ra=parseInt(result.away);
  if (isNaN(gh)||isNaN(ga)||isNaN(rh)||isNaN(ra)) return null;
  if (gh===rh&&ga===ra) return 3;
  const gw=gh>ga?"H":gh<ga?"A":"D";
  const rw=rh>ra?"H":rh<ra?"A":"D";
  return gw===rw?1:0;
}

function calcGroupTable(teams, games, getScore) {
  const t={};
  teams.forEach(n=>{t[n]={pts:0,gf:0,ga:0,gd:0,v:0,e:0,d:0,j:0};});
  games.forEach(g=>{
    const s=getScore(g.id); if(!s) return;
    const rh=parseInt(s.home),ra=parseInt(s.away); if(isNaN(rh)||isNaN(ra)) return;
    if(!t[g.home]) t[g.home]={pts:0,gf:0,ga:0,gd:0,v:0,e:0,d:0,j:0};
    if(!t[g.away]) t[g.away]={pts:0,gf:0,ga:0,gd:0,v:0,e:0,d:0,j:0};
    t[g.home].j++;t[g.away].j++;
    t[g.home].gf+=rh;t[g.home].ga+=ra;t[g.away].gf+=ra;t[g.away].ga+=rh;
    t[g.home].gd+=rh-ra;t[g.away].gd+=ra-rh;
    if(rh>ra){t[g.home].pts+=3;t[g.home].v++;t[g.away].d++;}
    else if(rh<ra){t[g.away].pts+=3;t[g.away].v++;t[g.home].d++;}
    else{t[g.home].pts+=1;t[g.away].pts+=1;t[g.home].e++;t[g.away].e++;}
  });
  return Object.entries(t).map(([name,s])=>({name,...s}))
    .sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.name.localeCompare(b.name));
}

const GROUPS = [...new Set(SCHEDULE.filter(g=>!g.knockout).map(g=>g.group))].sort();
const FILTER_OPTS = ["Todos","Hoje",...GROUPS.map(g=>"Grupo "+g),"32 Avos","Oitavas","Quartas","Semifinal","3º Lugar","Final"];
const TABS = ["📅 Hoje","🗓️ Agenda","🏆 Meus Palpites","👀 Palpites de Todos","📊 Ranking","🔀 Chaveamento","⚙️ Admin"];

// Avatar colorido por inicial
const AVATAR_COLORS = ["#009c3b","#002776","#c8a200","#8b1010","#005580","#4a0080","#803000","#008080"];
const avatarColor = name => AVATAR_COLORS[(name.charCodeAt(0)||0) % AVATAR_COLORS.length];

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Firebase
  const [db, setDb]           = useState(null);
  const [fbReady, setFbReady] = useState(false);
  const [fbError, setFbError] = useState(false);

  // Auth
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("bg26_user") || null);
  const [loginName, setLoginName]     = useState("");
  const [loginError, setLoginError]   = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [newName, setNewName]         = useState("");

  // Dados globais (Firebase)
  const [allGuesses,     setAllGuesses]     = useState({});
  const [results,        setResults]        = useState({});
  const [participants,   setParticipants]   = useState([]);

  // UI
  const [tab,           setTab]           = useState(0);
  const [filterGroup,   setFilterGroup]   = useState("Todos");
  const [liveFetching,  setLiveFetching]  = useState(false);
  const [lastUpdate,    setLastUpdate]    = useState(localStorage.getItem("bg26_lu")||null);
  const [notification,  setNotification]  = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminInput,    setAdminInput]    = useState("");
  const [apiKey,        setApiKey]        = useState(localStorage.getItem("bg26_apikey")||"");
  const [comparePick,   setComparePick]   = useState(null);

  const notify = (msg, type="ok") => { setNotification({msg,type}); setTimeout(()=>setNotification(null),3200); };

  // ── Init Firebase ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const database = getDatabase(app);
      setDb(database);
      setFbReady(true);
    } catch(e) {
      console.error("Firebase init error:", e);
      setFbError(true);
    }
  }, []);

  // ── Listeners Firebase ────────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const rParticipants = dbRef(db, "participants");
    const rResults      = dbRef(db, "results");
    const rGuesses      = dbRef(db, "guesses");

    const unsubP = onValue(rParticipants, snap => {
      const val = snap.val();
      setParticipants(val ? Object.values(val).sort() : []);
    });
    const unsubR = onValue(rResults, snap => {
      setResults(snap.val() || {});
    });
    const unsubG = onValue(rGuesses, snap => {
      setAllGuesses(snap.val() || {});
    });

    return () => { off(rParticipants); off(rResults); off(rGuesses); };
  }, [db]);

  // ── Helpers Firebase ──────────────────────────────────────────────────────
  async function registerUser(name) {
    const clean = name.trim();
    if (!clean) { setLoginError("Digite um nome."); return; }
    if (clean.length < 2) { setLoginError("Nome muito curto."); return; }
    if (participants.includes(clean)) { setLoginError("Este nome já está em uso. Escolha outro."); return; }
    try {
      const key = clean.replace(/[.#$[\]/]/g,"_");
      await set(dbRef(db, `participants/${key}`), clean);
      localStorage.setItem("bg26_user", clean);
      setCurrentUser(clean);
      setComparePick(clean);
      notify(`✅ Bem-vindo(a) ao bolão, ${clean}!`);
    } catch(e) {
      setLoginError("Erro ao cadastrar. Tente novamente.");
    }
  }

  async function loginUser(name) {
    const clean = name.trim();
    if (!participants.includes(clean)) {
      setLoginError("Nome não encontrado. Verifique ou cadastre-se.");
      return;
    }
    localStorage.setItem("bg26_user", clean);
    setCurrentUser(clean);
    setComparePick(clean);
    notify(`⚽ Bem-vindo(a) de volta, ${clean}!`);
  }

  async function saveGuess(gameId, side, val) {
    if (!currentUser || !db) return;
    const key = currentUser.replace(/[.#$[\]/]/g,"_");
    await set(dbRef(db, `guesses/${key}/${gameId}/${side}`), val);
  }

  async function saveResult(gameId, side, val) {
    if (!db) return;
    await set(dbRef(db, `results/${gameId}/${side}`), val);
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const myKey      = currentUser?.replace(/[.#$[\]/]/g,"_") || "";
  const myGuesses  = allGuesses[myKey] || {};
  const getGuessOf = (p, id) => { const k=p.replace(/[.#$[\]/]/g,"_"); return allGuesses[k]?.[id]; };
  const getResult  = id => results[id];

  function getRanking() {
    return participants.map(p => {
      let pts=0,exact=0,win=0;
      SCHEDULE.filter(g=>!g.knockout).forEach(g=>{
        const r=getResult(g.id), gu=getGuessOf(p,g.id);
        if(r&&gu){const pt=calcPoints(gu,r);if(pt!=null){pts+=pt;if(pt===3)exact++;if(pt===1)win++;}}
      });
      return {name:p,pts,exact,win};
    }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact||b.win-a.win);
  }

  const ranking = getRanking();
  const leader  = ranking[0];

  function getRealGroupTable(group) {
    const teams = [...new Set(SCHEDULE.filter(g=>g.group===group&&!g.knockout).flatMap(g=>[g.home,g.away]))];
    return calcGroupTable(teams, SCHEDULE.filter(g=>g.group===group&&!g.knockout), id=>getResult(id));
  }

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

  // ── Busca automática ──────────────────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    setLiveFetching(true);
    try {
      if (!apiKey) { notify("⚠️ Configure sua chave de API na aba Admin","warn"); setLiveFetching(false); return; }
      const res = await fetch(
        "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED&season=2026",
        { headers: {"X-Auth-Token": apiKey} }
      );
      if (!res.ok) throw new Error("API "+res.status);
      const data = await res.json();
      for (const m of (data.matches||[])) {
        const hn = (m.homeTeam?.shortName||m.homeTeam?.name||"").toLowerCase().slice(0,4);
        const found = SCHEDULE.find(s => s.home.toLowerCase().startsWith(hn)||hn.startsWith(s.home.toLowerCase().slice(0,4)));
        if (found && m.score?.fullTime?.home != null) {
          await set(dbRef(db, `results/${found.id}`), {
            home: String(m.score.fullTime.home),
            away: String(m.score.fullTime.away)
          });
        }
      }
      const t = new Date().toLocaleTimeString("pt-BR");
      setLastUpdate(t); localStorage.setItem("bg26_lu",t);
      notify("✅ Resultados atualizados!");
    } catch { notify("❌ Erro na API. Verifique a chave.","err"); }
    setLiveFetching(false);
  }, [db, apiKey]);

  useEffect(() => {
    const iv = setInterval(() => { if(SCHEDULE.some(g=>isToday(g.date))) fetchLive(); }, 5*60*1000);
    return () => clearInterval(iv);
  }, [fetchLive]);

  // ──────────────────────────────────────────────────────────────────────────
  // TELA DE CONFIGURAÇÃO FIREBASE (se não configurado)
  // ──────────────────────────────────────────────────────────────────────────
  if (FIREBASE_CONFIG.apiKey === "COLE_AQUI_SUA_apiKey") {
    return (
      <div style={{minHeight:"100vh",background:"#060d18",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{maxWidth:600,background:"rgba(255,255,255,.04)",border:"2px solid #ffdf00",borderRadius:16,padding:32,fontFamily:"sans-serif"}}>
          <div style={{fontSize:28,fontFamily:"'Bebas Neue',Impact,sans-serif",letterSpacing:4,color:"#ffdf00",marginBottom:16}}>
            ⚙️ CONFIGURE O FIREBASE
          </div>
          <p style={{color:"#ccc",lineHeight:1.8,marginBottom:20}}>
            Para o bolão funcionar com sincronização em tempo real, siga os passos:
          </p>
          <ol style={{color:"#aaa",lineHeight:2.2,paddingLeft:20}}>
            <li>Acesse <a href="https://console.firebase.google.com" target="_blank" style={{color:"#ffdf00"}}>console.firebase.google.com</a></li>
            <li>Clique em <strong style={{color:"#fff"}}>"Criar projeto"</strong> → dê o nome <code style={{color:"#009c3b"}}>bolao-do-gestor</code></li>
            <li>Vá em <strong style={{color:"#fff"}}>Build → Realtime Database</strong> → "Criar banco de dados" → modo teste</li>
            <li>Clique em <strong style={{color:"#fff"}}>"⚙️ Configurações do projeto"</strong> → "Seus apps" → "Web" → copie o objeto <code style={{color:"#009c3b"}}>firebaseConfig</code></li>
            <li>Cole os valores no arquivo <code style={{color:"#009c3b"}}>src/App.jsx</code> na variável <code style={{color:"#ffdf00"}}>FIREBASE_CONFIG</code></li>
            <li>Salve, rode <code style={{color:"#009c3b"}}>git add . && git commit -m "firebase" && git push</code> e o Vercel publica automaticamente</li>
          </ol>
          <div style={{background:"rgba(0,156,59,.1)",border:"1px solid #009c3b",borderRadius:8,padding:16,marginTop:16,color:"#aaa",fontSize:13,lineHeight:1.8}}>
            <strong style={{color:"#009c3b"}}>Regras do banco (cole em Rules no Firebase):</strong><br/>
            <code style={{color:"#fff",fontSize:12}}>{`{ "rules": { ".read": true, ".write": true } }`}</code>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TELA DE LOGIN / CADASTRO
  // ──────────────────────────────────────────────────────────────────────────
  if (!fbReady) {
    return (
      <div style={{minHeight:"100vh",background:"#060d18",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:"#ffdf00",fontFamily:"'Bebas Neue',Impact,sans-serif",fontSize:24,letterSpacing:4}}>
          ⚽ Conectando ao Bolão...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{minHeight:"100vh",
        background:"radial-gradient(ellipse at 30% 0%,#003d1a 0%,#001a0a 40%,#050d1a 70%,#000509 100%)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>

        <div style={{width:"100%",maxWidth:420}}>
          {/* Logo */}
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:48,fontFamily:"'Bebas Neue',Impact,sans-serif",letterSpacing:8,
              textShadow:"0 0 30px rgba(255,223,0,.4)"}}>⚽ BOLÃO DO GESTOR</div>
            <div style={{color:"#ffdf00",letterSpacing:4,fontSize:13,fontFamily:"'Bebas Neue',sans-serif"}}>
              By Prof. Isaac Martins
            </div>
            <div style={{color:"#555",fontSize:12,marginTop:4}}>🇧🇷 Brasil Rumo ao Hexa 🏆</div>
          </div>

          {/* Card */}
          <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,223,0,.3)",
            borderRadius:16,padding:28,backdropFilter:"blur(10px)"}}>

            {!showRegister ? (
              <>
                <div style={{fontSize:18,color:"#ffdf00",letterSpacing:3,fontFamily:"'Bebas Neue',sans-serif",marginBottom:4}}>
                  ENTRAR NO BOLÃO
                </div>
                <p style={{color:"#888",fontSize:13,marginBottom:20}}>
                  Digite o seu nome exatamente como foi cadastrado:
                </p>

                {/* Lista de participantes existentes */}
                {participants.length > 0 && (
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:"#666",marginBottom:8,letterSpacing:1}}>PARTICIPANTES CADASTRADOS:</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {participants.map(p=>(
                        <button key={p} onClick={()=>setLoginName(p)}
                          style={{background:loginName===p?"#009c3b":"rgba(255,255,255,.06)",
                            border:`1px solid ${loginName===p?"#009c3b":"#333"}`,
                            color:loginName===p?"#fff":"#ccc",borderRadius:20,
                            padding:"5px 14px",cursor:"pointer",fontSize:13,transition:".2s",
                            display:"flex",alignItems:"center",gap:6}}>
                          <span style={{width:22,height:22,borderRadius:"50%",
                            background:avatarColor(p),display:"inline-flex",
                            alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>
                            {p[0].toUpperCase()}
                          </span>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input type="text" placeholder="Seu nome no bolão" value={loginName}
                  onChange={e=>{setLoginName(e.target.value);setLoginError("");}}
                  onKeyDown={e=>e.key==="Enter"&&loginUser(loginName)}
                  style={{width:"100%",background:"#060f06",color:"#fff",
                    border:"2px solid #009c3b",borderRadius:8,padding:"10px 14px",
                    fontSize:15,marginBottom:8,outline:"none"}}/>
                {loginError && <div style={{color:"#ff6b6b",fontSize:12,marginBottom:8}}>{loginError}</div>}
                <button onClick={()=>loginUser(loginName)}
                  style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",
                    color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:16,
                    fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,cursor:"pointer",marginBottom:12}}>
                  ENTRAR ⚽
                </button>
                <button onClick={()=>{setShowRegister(true);setLoginError("");}}
                  style={{width:"100%",background:"transparent",color:"#ffdf00",
                    border:"1px solid rgba(255,223,0,.3)",borderRadius:8,padding:"10px",
                    fontSize:13,cursor:"pointer"}}>
                  ➕ Sou novo — quero me cadastrar
                </button>
              </>
            ) : (
              <>
                <div style={{fontSize:18,color:"#ffdf00",letterSpacing:3,fontFamily:"'Bebas Neue',sans-serif",marginBottom:4}}>
                  NOVO PARTICIPANTE
                </div>
                <p style={{color:"#888",fontSize:13,marginBottom:16}}>
                  Escolha um nome ou apelido para o bolão:
                </p>
                <input type="text" placeholder="Seu nome ou apelido" value={newName}
                  onChange={e=>{setNewName(e.target.value);setLoginError("");}}
                  onKeyDown={e=>e.key==="Enter"&&registerUser(newName)}
                  style={{width:"100%",background:"#060f06",color:"#fff",
                    border:"2px solid #ffdf00",borderRadius:8,padding:"10px 14px",
                    fontSize:15,marginBottom:8,outline:"none"}}/>
                {loginError && <div style={{color:"#ff6b6b",fontSize:12,marginBottom:8}}>{loginError}</div>}
                <button onClick={()=>registerUser(newName)}
                  style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",
                    color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:16,
                    fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,cursor:"pointer",marginBottom:12}}>
                  ENTRAR NO BOLÃO 🏆
                </button>
                <button onClick={()=>{setShowRegister(false);setLoginError("");}}
                  style={{width:"100%",background:"transparent",color:"#888",
                    border:"1px solid #333",borderRadius:8,padding:"10px",fontSize:13,cursor:"pointer"}}>
                  ← Voltar
                </button>
              </>
            )}
          </div>
          <div style={{textAlign:"center",marginTop:16,color:"#333",fontSize:11}}>
            bolao-do-gestor.vercel.app
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // APP PRINCIPAL (logado)
  // ──────────────────────────────────────────────────────────────────────────
  const myRank = ranking.findIndex(r=>r.name===currentUser)+1;
  const myPts  = ranking.find(r=>r.name===currentUser)?.pts || 0;
  const todayGames = SCHEDULE.filter(g=>isToday(g.date));

  // Card de jogo reutilizável
  const GameRow = ({g, mode="agenda"}) => {
    const r   = getResult(g.id);
    const gu  = myGuesses[g.id];
    const pts = r&&gu ? calcPoints(gu,r) : null;
    const past = isPast(g.date);
    const today = isToday(g.date);
    const hasR  = r && r.home!=="" && r.home!==undefined;
    const locked = past && !adminUnlocked;
    const border = hasR?"#009c3b":today?"#ffdf00":"#1a2e1a";
    const bg     = hasR?"rgba(0,156,59,.07)":today?"rgba(255,223,0,.05)":"rgba(255,255,255,.02)";

    return (
      <div style={{background:bg,border:`1px solid ${border}`,borderRadius:12,overflow:"hidden",marginBottom:8}}>
        {/* Cabeçalho data/hora */}
        <div style={{background:today?"rgba(255,223,0,.12)":"rgba(255,255,255,.04)",
          borderBottom:`1px solid ${border}`,padding:"6px 14px",
          display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {today && <span style={{background:"#cc0000",color:"#fff",fontSize:9,fontWeight:700,
              padding:"2px 7px",borderRadius:20,letterSpacing:1}}>🔴 HOJE</span>}
            <span style={{fontSize:13,color:"#ffdf00",fontWeight:700,letterSpacing:1}}>{fmtDate(g.date)}</span>
            <span style={{fontSize:20,color:"#fff",fontWeight:900,letterSpacing:2}}>{fmtTime(g.date)}</span>
            <span style={{fontSize:10,color:"#666"}}>BRT · 📍{g.city}</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            {!g.knockout&&<span style={{background:"#002776",color:"#aaa",fontSize:9,padding:"2px 7px",borderRadius:20}}>GR.{g.group}</span>}
            {g.knockout&&<span style={{background:"#3a0050",color:"#ddaaff",fontSize:9,padding:"2px 7px",borderRadius:20}}>{PHASE_LABEL[g.group]||g.group}</span>}
          </div>
        </div>

        {/* Confronto */}
        <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,justifyContent:"center",flexWrap:"wrap",minWidth:200}}>
            <span style={{fontSize:22}}>{flag(g.home)}</span>
            <span style={{fontSize:13}}>{g.home}</span>

            {mode==="meus" ? (<>
              <input type="number" min="0" max="20" value={gu?.home??""} disabled={locked}
                onChange={e=>saveGuess(g.id,"home",e.target.value)}
                placeholder="–"
                style={{width:44,textAlign:"center",background:"#060f06",color:"#fff",
                  border:`2px solid ${locked?"#2a2a2a":"#009c3b"}`,borderRadius:6,
                  padding:"5px 2px",fontSize:20,fontFamily:"monospace",opacity:locked?.55:1}}/>
              <span style={{color:"#ffdf00",fontSize:20,fontWeight:900}}>×</span>
              <input type="number" min="0" max="20" value={gu?.away??""} disabled={locked}
                onChange={e=>saveGuess(g.id,"away",e.target.value)}
                placeholder="–"
                style={{width:44,textAlign:"center",background:"#060f06",color:"#fff",
                  border:`2px solid ${locked?"#2a2a2a":"#009c3b"}`,borderRadius:6,
                  padding:"5px 2px",fontSize:20,fontFamily:"monospace",opacity:locked?.55:1}}/>
            </>) : mode==="admin" ? (<>
              <input type="number" min="0" max="20" value={r?.home??""} onChange={e=>saveResult(g.id,"home",e.target.value)}
                placeholder="–"
                style={{width:44,textAlign:"center",background:"#060f06",color:"#ffdf00",
                  border:"2px solid #ffdf00",borderRadius:6,padding:"5px 2px",fontSize:20,fontFamily:"monospace"}}/>
              <span style={{color:"#fff",fontSize:20,fontWeight:900}}>×</span>
              <input type="number" min="0" max="20" value={r?.away??""} onChange={e=>saveResult(g.id,"away",e.target.value)}
                placeholder="–"
                style={{width:44,textAlign:"center",background:"#060f06",color:"#ffdf00",
                  border:"2px solid #ffdf00",borderRadius:6,padding:"5px 2px",fontSize:20,fontFamily:"monospace"}}/>
            </>) : (
              hasR
                ? <span style={{fontSize:28,letterSpacing:4,color:"#ffdf00",fontWeight:900,minWidth:80,textAlign:"center"}}>{r.home}×{r.away}</span>
                : <span style={{fontSize:22,color:"#2a2a2a",minWidth:60,textAlign:"center"}}>×</span>
            )}

            <span style={{fontSize:13}}>{g.away}</span>
            <span style={{fontSize:22}}>{flag(g.away)}</span>
          </div>

          {/* Badge pontos (modo meus palpites) */}
          {mode==="meus" && (
            <div style={{minWidth:64,textAlign:"center"}}>
              {hasR&&gu&&<>
                {pts===3&&<span style={{background:"#009c3b",color:"#fff",padding:"4px 10px",borderRadius:6,fontFamily:"sans-serif",fontSize:12,fontWeight:700,display:"block"}}>✓ 3 pts</span>}
                {pts===1&&<span style={{background:"#c8a200",color:"#fff",padding:"4px 10px",borderRadius:6,fontFamily:"sans-serif",fontSize:12,fontWeight:700,display:"block"}}>〜 1 pt</span>}
                {pts===0&&<span style={{background:"#5a1010",color:"#ffaaaa",padding:"4px 10px",borderRadius:6,fontFamily:"sans-serif",fontSize:11,fontWeight:700,display:"block"}}>✗ 0 pt</span>}
                <div style={{fontSize:10,color:"#666",fontFamily:"sans-serif",marginTop:2}}>[{r.home}×{r.away}]</div>
              </>}
              {locked&&!hasR&&<span style={{color:"#333",fontSize:14}}>🔒</span>}
            </div>
          )}
          {mode==="agenda" && (
            <div style={{fontSize:11,fontFamily:"sans-serif",color:hasR?"#009c3b":past?"#555":"#ffdf00",minWidth:70,textAlign:"right"}}>
              {hasR?"✅ Final":past?"⏳ Aguardando":"🕐 Em breve"}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",
      background:"radial-gradient(ellipse at 30% 0%,#003d1a 0%,#001a0a 40%,#050d1a 70%,#000509 100%)",
      fontFamily:"'Bebas Neue',Impact,sans-serif",color:"#fff"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;} input,select,button{font-family:inherit;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:linear-gradient(#009c3b,#002776);border-radius:3px;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .tb:hover{background:rgba(255,223,0,.1)!important;color:#ffdf00!important;}
        input[type=number]::-webkit-inner-spin-button{opacity:.5;}
        input:focus{outline:none;}
      `}</style>

      {/* ── HEADER ── */}
      <header>
        <div style={{background:"linear-gradient(135deg,#004d22 0%,#009c3b 25%,#002776 60%,#001240 100%)"}}>
          <div style={{background:"rgba(0,0,0,.52)",padding:"14px 18px",
            display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontSize:38,letterSpacing:7,lineHeight:1,textShadow:"0 0 30px rgba(255,223,0,.35)"}}>
                ⚽ BOLÃO DO GESTOR
              </div>
              <div style={{fontSize:11,letterSpacing:4,color:"#ffdf00",fontFamily:"sans-serif",fontWeight:300}}>
                By Prof. Isaac Martins · 🇧🇷 Brasil Rumo ao Hexa 🏆
              </div>
            </div>
            {/* Info do usuário logado */}
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#888",fontFamily:"sans-serif"}}>VOCÊ ESTÁ COMO</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:avatarColor(currentUser),
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:16,fontWeight:700,color:"#fff"}}>
                    {currentUser[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:18,color:"#ffdf00",letterSpacing:1}}>{currentUser}</div>
                    <div style={{fontSize:11,color:"#aaa",fontFamily:"sans-serif"}}>
                      {myRank > 0 ? `${myRank}º lugar · ${myPts} pts` : "0 pts"}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10,color:"#888",fontFamily:"sans-serif"}}>🏅 LÍDER</div>
                <div style={{fontSize:16,color:"#ffdf00"}}>{leader?.name||"—"}</div>
                <div style={{fontSize:12,color:"#aaa",fontFamily:"sans-serif"}}>{leader?.pts||0} pts</div>
              </div>
              <button onClick={()=>{localStorage.removeItem("bg26_user");setCurrentUser(null);}}
                style={{background:"transparent",border:"1px solid #333",color:"#666",
                  borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:"sans-serif"}}>
                Sair
              </button>
            </div>
          </div>
        </div>
        <div style={{height:4,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
      </header>

      {/* ── BARRA STATUS ── */}
      <div style={{background:"rgba(0,0,0,.8)",borderBottom:"1px solid #0a200a",
        padding:"6px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <button onClick={fetchLive} disabled={liveFetching} style={{
          background:liveFetching?"#1a1a1a":"linear-gradient(135deg,#009c3b,#006622)",
          color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",
          cursor:"pointer",fontSize:12,fontWeight:700,transition:".2s"}}>
          {liveFetching?"⏳ Buscando...":"🔄 Atualizar Placares"}
        </button>
        {lastUpdate&&<span style={{fontFamily:"sans-serif",fontSize:11,color:"#555"}}>🕐 {lastUpdate}</span>}
        <span style={{fontFamily:"sans-serif",fontSize:11,color:"#333",marginLeft:"auto"}}>
          {participants.length} participantes · ⚡ Auto 5min em dias de jogo
        </span>
      </div>

      {/* ── NOTIFICAÇÃO ── */}
      {notification && (
        <div style={{position:"fixed",top:86,right:14,zIndex:999,animation:"pop .3s ease",
          background:notification.type==="err"?"#7a1010":notification.type==="warn"?"#7a5000":"#005a22",
          color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",fontSize:13,
          boxShadow:"0 4px 20px rgba(0,0,0,.7)"}}>
          {notification.msg}
        </div>
      )}

      {/* ── TABS ── */}
      <nav style={{background:"rgba(0,0,0,.8)",borderBottom:"2px solid rgba(255,223,0,.3)",
        display:"flex",overflowX:"auto",backdropFilter:"blur(10px)"}}>
        {TABS.map((t,i)=>(
          <button key={i} className="tb" onClick={()=>setTab(i)} style={{
            background:tab===i?"rgba(255,223,0,.14)":"transparent",
            color:tab===i?"#ffdf00":"#888",border:"none",cursor:"pointer",
            padding:"12px 14px",fontSize:12,fontWeight:700,letterSpacing:1,
            whiteSpace:"nowrap",transition:".2s",
            borderBottom:tab===i?"3px solid #ffdf00":"3px solid transparent"}}>
            {t}
          </button>
        ))}
      </nav>

      <main style={{maxWidth:1040,margin:"0 auto",padding:"18px 12px"}}>

        {/* ═══ TAB 0 – HOJE ═══ */}
        {tab===0 && (
          <div>
            <div style={{fontSize:26,letterSpacing:4,color:"#ffdf00",marginBottom:4}}>📅 JOGOS DE HOJE</div>
            <div style={{fontFamily:"sans-serif",fontSize:13,color:"#777",marginBottom:20}}>
              {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
            </div>
            {todayGames.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",fontFamily:"sans-serif",color:"#555"}}>
                <div style={{fontSize:52,marginBottom:12}}>⚽</div>
                <div style={{fontSize:18,color:"#777",marginBottom:6}}>Nenhum jogo hoje</div>
                <div style={{fontSize:13}}>Confira a aba Agenda para os próximos jogos</div>
              </div>
            ) : (<>
              <div style={{marginBottom:20}}>
                {todayGames.sort((a,b)=>a.date.localeCompare(b.date)).map(g=><GameRow key={g.id} g={g}/>)}
              </div>

              {/* Palpites de todos hoje */}
              <div style={{background:"rgba(255,223,0,.05)",border:"1px solid rgba(255,223,0,.15)",
                borderRadius:12,padding:"16px 18px"}}>
                <div style={{fontSize:17,letterSpacing:3,color:"#ffdf00",marginBottom:14}}>
                  👀 PALPITES DE TODOS NOS JOGOS DE HOJE
                </div>
                <div style={{display:"grid",gap:12}}>
                  {todayGames.map(g=>{
                    const r=getResult(g.id);
                    const hasR=r&&r.home!==undefined;
                    return (
                      <div key={g.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a2a1a",borderRadius:10,padding:"12px 14px"}}>
                        <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:8}}>
                          {flag(g.home)} {g.home} × {g.away} {flag(g.away)}
                          {hasR&&<span style={{color:"#009c3b",marginLeft:8}}>→ Resultado: {r.home}×{r.away}</span>}
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                          {participants.map(p=>{
                            const gu=getGuessOf(p,g.id);
                            const pts=r&&gu?calcPoints(gu,r):null;
                            const isMe=p===currentUser;
                            return (
                              <div key={p} style={{
                                background:pts===3?"rgba(0,156,59,.2)":pts===1?"rgba(200,162,0,.2)":pts===0?"rgba(90,16,16,.2)":"rgba(255,255,255,.04)",
                                border:`1px solid ${pts===3?"#009c3b":pts===1?"#c8a200":pts===0?"#5a1010":isMe?"#ffdf00":"#2a2a2a"}`,
                                borderRadius:8,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
                                <span style={{width:22,height:22,borderRadius:"50%",background:avatarColor(p),
                                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                                  fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>
                                  {p[0].toUpperCase()}
                                </span>
                                <div>
                                  <div style={{fontFamily:"sans-serif",fontSize:11,color:isMe?"#ffdf00":"#aaa",fontWeight:isMe?700:400}}>
                                    {p}{isMe?" (você)":""}
                                  </div>
                                  <div style={{fontFamily:"monospace",fontSize:15,color:"#fff",fontWeight:700}}>
                                    {gu?.home!==undefined?`${gu.home}×${gu.away}`:"–"}
                                    {pts===3&&" 🎯"}
                                    {pts===1&&" ✅"}
                                    {pts===0&&" ❌"}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>)}
          </div>
        )}

        {/* ═══ TAB 1 – AGENDA ═══ */}
        {tab===1 && (
          <div>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)}
                style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",
                  padding:"8px 12px",borderRadius:6,fontSize:13,fontFamily:"sans-serif",cursor:"pointer"}}>
                {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
              </select>
              <span style={{fontFamily:"sans-serif",fontSize:12,color:"#555"}}>{filteredGames().length} jogos</span>
            </div>
            {filteredGames().map(g=><GameRow key={g.id} g={g}/>)}
          </div>
        )}

        {/* ═══ TAB 2 – MEUS PALPITES ═══ */}
        {tab===2 && (
          <div>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:avatarColor(currentUser),
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700}}>
                  {currentUser[0].toUpperCase()}
                </div>
                <span style={{fontSize:20,letterSpacing:2,color:"#ffdf00"}}>{currentUser}</span>
              </div>
              <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)}
                style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",
                  padding:"7px 10px",borderRadius:6,fontSize:12,fontFamily:"sans-serif",cursor:"pointer"}}>
                {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
              </select>
              <span style={{fontFamily:"sans-serif",fontSize:11,color:"#555"}}>
                {filteredGames().filter(g=>myGuesses[g.id]?.home!==undefined).length}/{filteredGames().length} preenchidos
              </span>
            </div>
            {filteredGames().map(g=><GameRow key={g.id} g={g} mode="meus"/>)}
            <p style={{textAlign:"center",marginTop:14,fontFamily:"sans-serif",fontSize:11,color:"#444"}}>
              💾 Sincronizado em tempo real · 🔒 Bloqueados após o início de cada jogo
            </p>
          </div>
        )}

        {/* ═══ TAB 3 – PALPITES DE TODOS ═══ */}
        {tab===3 && (
          <div>
            <div style={{fontSize:22,letterSpacing:4,color:"#ffdf00",marginBottom:6}}>👀 PALPITES DE TODOS</div>
            <p style={{fontFamily:"sans-serif",fontSize:13,color:"#777",marginBottom:16}}>
              Compare os palpites de todos os participantes jogo a jogo. Os palpites ficam visíveis após o início de cada partida.
            </p>

            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)}
                style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",
                  padding:"7px 10px",borderRadius:6,fontSize:13,fontFamily:"sans-serif",cursor:"pointer"}}>
                {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>

            {filteredGames().map(g=>{
              const r    = getResult(g.id);
              const past = isPast(g.date);
              const hasR = r && r.home!==undefined;
              // Só mostra palpites depois que o jogo começou
              const showPalpites = past;

              return (
                <div key={g.id} style={{background:"rgba(255,255,255,.02)",border:"1px solid #1a2a1a",
                  borderRadius:12,overflow:"hidden",marginBottom:12}}>
                  {/* Header */}
                  <div style={{background:"rgba(255,255,255,.05)",borderBottom:"1px solid #1a2a1a",
                    padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:13,color:"#ffdf00",fontWeight:700}}>{fmtDate(g.date)}</span>
                      <span style={{fontSize:18,fontWeight:900}}>{fmtTime(g.date)}</span>
                      <span style={{fontSize:11,color:"#555"}}>📍{g.city}</span>
                    </div>
                    <div style={{fontFamily:"sans-serif",fontSize:13,display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:20}}>{flag(g.home)}</span>
                      <strong>{g.home}</strong>
                      {hasR
                        ? <span style={{color:"#ffdf00",fontSize:20,fontWeight:900,letterSpacing:3}}>{r.home}×{r.away}</span>
                        : <span style={{color:"#333",fontSize:16}}>×</span>}
                      <strong>{g.away}</strong>
                      <span style={{fontSize:20}}>{flag(g.away)}</span>
                    </div>
                  </div>

                  {/* Palpites */}
                  <div style={{padding:"10px 14px"}}>
                    {!showPalpites ? (
                      <div style={{fontFamily:"sans-serif",fontSize:12,color:"#555",textAlign:"center",padding:"8px 0"}}>
                        🔒 Os palpites serão revelados após o início do jogo
                      </div>
                    ) : (
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {participants.map(p=>{
                          const gu  = getGuessOf(p,g.id);
                          const pts = hasR&&gu ? calcPoints(gu,r) : null;
                          const isMe = p===currentUser;
                          return (
                            <div key={p} style={{
                              background:pts===3?"rgba(0,156,59,.18)":pts===1?"rgba(200,162,0,.15)":pts===0&&hasR?"rgba(90,16,16,.18)":"rgba(255,255,255,.04)",
                              border:`1px solid ${pts===3?"#009c3b":pts===1?"#c8a200":pts===0&&hasR?"#5a1010":isMe?"rgba(255,223,0,.4)":"#2a2a2a"}`,
                              borderRadius:10,padding:"8px 12px",minWidth:100}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                                <span style={{width:20,height:20,borderRadius:"50%",background:avatarColor(p),
                                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                                  fontSize:10,fontWeight:700,color:"#fff"}}>
                                  {p[0].toUpperCase()}
                                </span>
                                <span style={{fontFamily:"sans-serif",fontSize:11,
                                  color:isMe?"#ffdf00":"#aaa",fontWeight:isMe?700:400}}>
                                  {p}{isMe?" ★":""}
                                </span>
                              </div>
                              <div style={{fontFamily:"monospace",fontSize:22,fontWeight:900,
                                color:pts===3?"#009c3b":pts===1?"#c8a200":pts===0&&hasR?"#ff6b6b":"#fff",
                                textAlign:"center"}}>
                                {gu?.home!==undefined?`${gu.home}×${gu.away}`:"—"}
                              </div>
                              {pts!==null&&<div style={{textAlign:"center",marginTop:4,fontFamily:"sans-serif",fontSize:11,
                                color:pts===3?"#009c3b":pts===1?"#c8a200":"#ff6b6b",fontWeight:700}}>
                                {pts===3?"🎯 3pts":pts===1?"✅ 1pt":"❌ 0pt"}
                              </div>}
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

        {/* ═══ TAB 4 – RANKING ═══ */}
        {tab===4 && (
          <div>
            <h2 style={{letterSpacing:5,color:"#ffdf00",marginBottom:14,fontSize:24}}>🏆 RANKING GERAL</h2>
            <div style={{display:"grid",gap:8,marginBottom:28}}>
              {ranking.map((p,i)=>{
                const isMe=p.name===currentUser;
                return (
                  <div key={p.name} style={{
                    background:i===0?"linear-gradient(90deg,rgba(255,215,0,.16),transparent)":
                      i===1?"linear-gradient(90deg,rgba(192,192,192,.08),transparent)":
                      i===2?"linear-gradient(90deg,rgba(205,127,50,.08),transparent)":"rgba(255,255,255,.03)",
                    border:`2px solid ${isMe?"#ffdf00":i===0?"rgba(255,215,0,.4)":i===1?"rgba(192,192,192,.3)":i===2?"rgba(205,127,50,.3)":"#1a1a1a"}`,
                    borderRadius:10,padding:"13px 16px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",
                      justifyContent:"center",background:avatarColor(p.name),
                      color:"#fff",fontSize:16,fontWeight:700}}>
                      {p.name[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:19,letterSpacing:2,color:isMe?"#ffdf00":"#fff"}}>
                        {p.name}{isMe&&<span style={{fontSize:12,color:"#ffdf00",marginLeft:8,fontFamily:"sans-serif"}}>← você</span>}
                      </div>
                      <div style={{fontSize:11,color:"#666",fontFamily:"sans-serif",marginTop:2}}>
                        🎯 {p.exact} exatos · ✅ {p.win} acertos
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:i===0?"#ffdf00":i===1?"#aaa":i===2?"#cd7f32":"#1a2a1a",
                        display:"flex",alignItems:"center",justifyContent:"center",color:i<3?"#000":"#777",fontSize:14,fontWeight:900}}>
                        {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:30,color:isMe?"#ffdf00":i===0?"#ffdf00":"#fff",lineHeight:1}}>{p.pts}</div>
                        <div style={{fontSize:10,color:"#555",fontFamily:"sans-serif"}}>PTS</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <h2 style={{letterSpacing:5,color:"#ffdf00",marginBottom:14,fontSize:20}}>📋 TABELA DOS GRUPOS</h2>
            <div style={{display:"grid",gap:14,gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))"}}>
              {GROUPS.map(g=>{
                const table = getRealGroupTable(g);
                return (
                  <div key={g} style={{background:"rgba(255,255,255,.03)",border:"1px solid #0d2010",borderRadius:10,overflow:"hidden"}}>
                    <div style={{background:"linear-gradient(90deg,#004d22,#009c3b)",padding:"7px 14px",fontSize:15,letterSpacing:4}}>GRUPO {g}</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"sans-serif",fontSize:12}}>
                      <thead><tr style={{color:"#555",borderBottom:"1px solid #0d0d0d"}}>
                        <th style={{padding:"5px 10px",textAlign:"left",fontWeight:400,fontSize:10}}>Seleção</th>
                        <th style={{padding:"5px 5px",fontWeight:700,fontSize:11,color:"#ffdf00"}}>Pts</th>
                        <th style={{padding:"5px 4px",fontWeight:400,fontSize:10}}>J</th>
                        <th style={{padding:"5px 4px",fontWeight:400,fontSize:10}}>V</th>
                        <th style={{padding:"5px 4px",fontWeight:400,fontSize:10}}>E</th>
                        <th style={{padding:"5px 4px",fontWeight:400,fontSize:10}}>D</th>
                        <th style={{padding:"5px 4px",fontWeight:400,fontSize:10}}>SG</th>
                      </tr></thead>
                      <tbody>
                        {table.map((row,i)=>(
                          <tr key={row.name} style={{borderBottom:"1px solid #080808",background:i<2?"rgba(0,156,59,.07)":"transparent"}}>
                            <td style={{padding:"7px 10px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                {i<2&&<span style={{fontSize:8,color:"#009c3b"}}>●</span>}
                                <span style={{fontSize:15}}>{flag(row.name)}</span>
                                <span style={{color:"#ddd",fontSize:12}}>{row.name}</span>
                              </div>
                            </td>
                            <td style={{padding:"7px 5px",textAlign:"center",color:"#ffdf00",fontWeight:700,fontSize:14}}>{row.pts}</td>
                            <td style={{padding:"7px 4px",textAlign:"center",color:"#777"}}>{row.j}</td>
                            <td style={{padding:"7px 4px",textAlign:"center",color:"#777"}}>{row.v}</td>
                            <td style={{padding:"7px 4px",textAlign:"center",color:"#777"}}>{row.e}</td>
                            <td style={{padding:"7px 4px",textAlign:"center",color:"#777"}}>{row.d}</td>
                            <td style={{padding:"7px 4px",textAlign:"center",color:"#777"}}>{row.gd>=0?"+":""}{row.gd}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB 5 – CHAVEAMENTO ═══ */}
        {tab===5 && (
          <div>
            <h2 style={{letterSpacing:5,color:"#ffdf00",fontSize:22,marginBottom:14}}>🔀 CHAVEAMENTO</h2>
            <div style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",marginBottom:20}}>
              {GROUPS.map(g=>{
                const table = getRealGroupTable(g);
                return (
                  <div key={g} style={{background:"rgba(255,255,255,.03)",border:"1px solid #0d1d2a",borderRadius:10,overflow:"hidden"}}>
                    <div style={{background:"linear-gradient(90deg,#001240,#002776)",padding:"7px 12px",fontSize:14,letterSpacing:3}}>GRUPO {g}</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"sans-serif",fontSize:12}}>
                      <tbody>
                        {table.map((row,i)=>(
                          <tr key={row.name} style={{borderBottom:"1px solid #080808",background:i<2?"rgba(0,39,118,.15)":"transparent"}}>
                            <td style={{padding:"7px 8px",width:22,color:i===0?"#ffdf00":i===1?"#aaa":"#444",fontWeight:700,textAlign:"center"}}>{i+1}°</td>
                            <td style={{padding:"7px 3px",fontSize:15}}>{flag(row.name)}</td>
                            <td style={{padding:"7px 6px",color:"#ddd",fontSize:12}}>{row.name}</td>
                            <td style={{padding:"7px 8px",textAlign:"right",color:i<2?"#ffdf00":"#555",fontWeight:700}}>{row.pts}pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
            <p style={{fontFamily:"sans-serif",fontSize:12,color:"#555"}}>
              🔀 O chaveamento detalhado das fases eliminatórias será gerado automaticamente conforme os grupos se concluírem.
            </p>
          </div>
        )}

        {/* ═══ TAB 6 – ADMIN ═══ */}
        {tab===6 && (
          <div>
            {/* Unlock */}
            <div style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.3)",
              borderRadius:12,padding:"16px 20px",marginBottom:20}}>
              <div style={{fontSize:18,letterSpacing:3,color:"#ffdf00",marginBottom:10}}>🔐 MODO ADMIN</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                <input type="password" placeholder="Senha: copa2026" value={adminInput}
                  onChange={e=>setAdminInput(e.target.value)}
                  style={{background:"#050d0a",color:"#fff",border:"1px solid #444",
                    borderRadius:5,padding:"7px 12px",fontSize:13,fontFamily:"sans-serif"}}/>
                <button onClick={()=>{
                  if(adminInput===ADMIN_PASS){setAdminUnlocked(true);notify("✅ Admin liberado!");}
                  else notify("❌ Senha incorreta","err");
                }} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:5,
                  padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>Desbloquear</button>
                {adminUnlocked&&<span style={{color:"#009c3b",fontFamily:"sans-serif",fontSize:12,fontWeight:700}}>✅ Admin ativo</span>}
              </div>
            </div>

            {/* Resultados reais */}
            {adminUnlocked && (
              <div style={{marginBottom:24}}>
                <h3 style={{letterSpacing:4,color:"#ffdf00",marginBottom:12,fontSize:17}}>📝 INSERIR RESULTADOS REAIS</h3>
                <div style={{display:"flex",gap:10,marginBottom:12}}>
                  <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)}
                    style={{background:"#050d0a",color:"#fff",border:"1px solid #1a3a1a",
                      padding:"7px 10px",borderRadius:6,fontSize:12,fontFamily:"sans-serif",cursor:"pointer"}}>
                    {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                {filteredGames().map(g=><GameRow key={g.id} g={g} mode="admin"/>)}
              </div>
            )}

            {/* API */}
            <div style={{background:"rgba(0,156,59,.07)",border:"1px solid rgba(0,156,59,.3)",
              borderRadius:12,padding:"16px 20px",marginBottom:20}}>
              <div style={{fontSize:17,letterSpacing:3,color:"#009c3b",marginBottom:8}}>🌐 RESULTADOS AUTOMÁTICOS</div>
              <p style={{fontFamily:"sans-serif",fontSize:13,color:"#aaa",lineHeight:1.7,margin:"0 0 10px"}}>
                Cadastre-se grátis em <strong style={{color:"#fff"}}>football-data.org</strong> e cole sua chave abaixo.
              </p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                <input type="text" placeholder="Chave de API — football-data.org" value={apiKey}
                  onChange={e=>{setApiKey(e.target.value);localStorage.setItem("bg26_apikey",e.target.value);}}
                  style={{flex:1,minWidth:200,background:"#050d0a",color:"#fff",border:"2px solid #009c3b",
                    borderRadius:5,padding:"8px 12px",fontSize:13,fontFamily:"monospace"}}/>
                <button onClick={fetchLive} style={{background:"linear-gradient(135deg,#009c3b,#006622)",
                  color:"#fff",border:"none",borderRadius:5,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>
                  🔄 Testar & Atualizar
                </button>
              </div>
            </div>

            {/* Participantes */}
            <h2 style={{letterSpacing:4,color:"#ffdf00",marginBottom:12,fontSize:18}}>👥 PARTICIPANTES ({participants.length})</h2>
            <div style={{display:"grid",gap:8,maxWidth:460,marginBottom:20}}>
              {participants.map((p,i)=>(
                <div key={p} style={{background:"rgba(255,255,255,.04)",border:"1px solid #1a2a1a",
                  borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:avatarColor(p),
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff"}}>
                    {p[0].toUpperCase()}
                  </div>
                  <span style={{flex:1,fontSize:16,letterSpacing:1}}>{p}</span>
                  <span style={{fontFamily:"sans-serif",fontSize:11,color:"#555"}}>
                    {ranking.findIndex(r=>r.name===p)+1}º · {ranking.find(r=>r.name===p)?.pts||0}pts
                  </span>
                </div>
              ))}
            </div>
            <p style={{fontFamily:"sans-serif",fontSize:12,color:"#555"}}>
              Novos participantes podem entrar pelo link fazendo seu próprio cadastro.
            </p>

            {/* Regras */}
            <h2 style={{letterSpacing:4,color:"#ffdf00",marginBottom:12,fontSize:18,marginTop:20}}>📖 REGRAS</h2>
            <div style={{display:"grid",gap:10,maxWidth:520}}>
              {[
                {pts:"3 pts",c:"#009c3b",i:"🎯",t:"Placar Exato",d:"Acertou o placar correto (ex: 2×1 e saiu 2×1)."},
                {pts:"1 pt",c:"#c8a200",i:"✅",t:"Acertou o Vencedor/Empate",d:"Acertou quem ganha ou que empataria, mas errou o placar."},
                {pts:"0 pts",c:"#6a1010",i:"❌",t:"Errou",d:"Errou quem vence."},
              ].map(r=>(
                <div key={r.pts} style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a1a1a",
                  borderRadius:10,padding:"13px 16px",display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:r.c,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{r.i}</div>
                  <div>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                      <span style={{fontSize:15,letterSpacing:1}}>{r.t}</span>
                      <span style={{background:r.c,color:"#fff",padding:"1px 8px",borderRadius:20,fontFamily:"sans-serif",fontSize:10,fontWeight:700}}>{r.pts}</span>
                    </div>
                    <p style={{fontFamily:"sans-serif",fontSize:12,color:"#888",margin:0}}>{r.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <footer style={{textAlign:"center",padding:"18px",fontFamily:"sans-serif",fontSize:11,
        color:"#222",borderTop:"1px solid #0a0a0a",marginTop:24}}>
        ⚽ Bolão do Gestor · By Prof. Isaac Martins · 🇧🇷 Brasil Rumo ao Hexa
      </footer>
    </div>
  );
}
