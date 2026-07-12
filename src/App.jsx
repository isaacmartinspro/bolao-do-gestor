import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase, ref as dbRef, set, get, onValue, off,
  push, update, remove
} from "firebase/database";


// ── ErrorBoundary para capturar crashes e mostrar erro em vez de tela branca ──
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{minHeight:"100vh",background:"#050d0a",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",padding:32,gap:16}}>
          <div style={{fontSize:48}}>⚠️</div>
          <div style={{color:"#ffdf00",fontSize:22,letterSpacing:3,fontFamily:"sans-serif",textAlign:"center"}}>
            Algo deu errado
          </div>
          <div style={{background:"rgba(255,0,0,.1)",border:"1px solid #5a1010",borderRadius:8,
            padding:"12px 20px",fontFamily:"monospace",fontSize:12,color:"#ff9999",
            maxWidth:480,wordBreak:"break-all",textAlign:"left",whiteSpace:"pre-wrap"}}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button onClick={()=>window.location.href="/"}
            style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:10,
              padding:"12px 28px",fontSize:16,cursor:"pointer",fontFamily:"sans-serif"}}>
            ← Voltar ao início
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── FIREBASE ────────────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCcXAm_1AuVNSG98VkltUKOU8ov_EG3K8A",
  authDomain:        "bolao-do-gestor.firebaseapp.com",
  databaseURL:       "https://bolao-do-gestor-default-rtdb.firebaseio.com",
  projectId:         "bolao-do-gestor",
  storageBucket:     "bolao-do-gestor.firebasestorage.app",
  messagingSenderId: "1062610341798",
  appId:             "1:1062610341798:web:6c069efa7673e4d8d34967",
};

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const MASTER_PASS   = "isaacmartins2026";

// ─── PLANOS ──────────────────────────────────────────────────────────────────
const PLANOS = {
  gratis:  { nome:"Grátis",      icon:"🆓", maxBoloes:1, maxMembros:5,  cor:"#555",    corBg:"rgba(80,80,80,.15)"  },
  pro:     { nome:"Bolão Pro",   icon:"⚡", maxBoloes:1, maxMembros:50, cor:"#009c3b", corBg:"rgba(0,156,59,.15)"  },
  premium: { nome:"Bolão Premium",icon:"👑",maxBoloes:3, maxMembros:50, cor:"#c8a200", corBg:"rgba(200,162,0,.15)" },
};

function getLimites(admin) {
  const plano = PLANOS[admin?.plano||"gratis"];
  return { maxBoloes: plano.maxBoloes, maxMembros: plano.maxMembros, plano: admin?.plano||"gratis" };
}

const safeKey = s => s?.replace(/[.#$[\]/\s]/g,"_").toLowerCase() || "";

// ─── AVATARES ─────────────────────────────────────────────────────────────────
const AVATARES = [
  "⚽","🏆","🥇","🎯","🔥","⚡","💪","🦁","🐯","🦊",
  "😎","🤩","😜","🤠","🥳","😏","🤪","😈","👑","🎭",
  "🦅","🐺","🦈","🐻","🦋","🐲","🦊","🐸","🎖️","🌟",
  "👨","👩","👦","👧","🧔","👴","👵","🧑","👮","🕵️",
];
const AVATAR_COLORS = [
  "#009c3b","#002776","#c8a200","#8b1010","#005580",
  "#4a0080","#803000","#008080","#1a5a1a","#5a3a00",
];
const avatarBg = name => AVATAR_COLORS[(name?.charCodeAt(0)||0) % AVATAR_COLORS.length];

const MemberAvatar = ({member, size=40}) => {
  const hasEmoji = member?.avatar && AVATARES.includes(member.avatar);
  const bg = member?.avatarColor !== undefined
    ? AVATAR_COLORS[member.avatarColor % AVATAR_COLORS.length]
    : avatarBg(member?.apelido||"");
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:hasEmoji?size*0.55:size*0.42,fontWeight:700,color:"#fff",
      flexShrink:0,border:"2px solid rgba(255,255,255,.2)"}}>
      {hasEmoji ? member.avatar : (member?.apelido?.[0]?.toUpperCase()||"?")}
    </div>
  );
};

// ─── BANDEIRAS via flagcdn ────────────────────────────────────────────────────
const FLAG_CODES = {
  "Brasil":"br","Argentina":"ar","França":"fr","Alemanha":"de","Espanha":"es",
  "Inglaterra":"gb-eng","Portugal":"pt","México":"mx","EUA":"us","Uruguai":"uy",
  "Colômbia":"co","Canadá":"ca","Equador":"ec","Panamá":"pa","Bélgica":"be",
  "Marrocos":"ma","Japão":"jp","Holanda":"nl","Croácia":"hr","Austrália":"au",
  "Noruega":"no","Sérvia":"rs","Arábia Saudita":"sa","Senegal":"sn","Angola":"ao",
  "Tunísia":"tn","Dinamarca":"dk","Coreia do Sul":"kr","Suíça":"ch","Eslováquia":"sk",
  "Ucrânia":"ua","Argélia":"dz","África do Sul":"za","Tchéquia":"cz",
  "Bósnia-Herzegovina":"ba","Catar":"qa","Paraguai":"py","Turquia":"tr",
  "Costa do Marfim":"ci","Curaçao":"cw","Suécia":"se","Cabo Verde":"cv",
  "Egito":"eg","Irã":"ir","Nova Zelândia":"nz","Iraque":"iq","Jordânia":"jo",
  "Áustria":"at","RD Congo":"cd","Uzbequistão":"uz","Gana":"gh","Haiti":"ht",
  "Escócia":"gb-sct",
};
const Flag = ({team, size=32}) => {
  const code = FLAG_CODES[team];
  // flagcdn aceita: 20, 24, 32, 40, 48, 64, 80, 160, 240
  const validSizes = [20,24,32,40,48,64,80];
  const cdnSize = validSizes.reduce((prev,curr) =>
    Math.abs(curr-size) < Math.abs(prev-size) ? curr : prev
  );
  // Tamanho mínimo de exibição: 28px
  const displaySize = Math.max(size, 28);
  if (!code) return <span style={{fontSize:displaySize*0.8,lineHeight:1}}>🏳️</span>;
  return (
    <img
      src={`https://flagcdn.com/h${cdnSize}/${code}.png`}
      alt={team}
      style={{
        width:displaySize,
        height:Math.round(displaySize*0.75),
        objectFit:"cover",
        borderRadius:3,
        verticalAlign:"middle",
        display:"inline-block"
      }}
      onError={e=>{e.target.style.display="none";}}
    />
  );
};

// ─── CALENDÁRIO FIFA 2026 ─────────────────────────────────────────────────────
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
  {id:31, home:"Turquia",           away:"Paraguai",           group:"D", date:"2026-06-20T00:00", city:"São Francisco"},
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
  {id:36, home:"Tunísia",           away:"Japão",              group:"F", date:"2026-06-21T01:00", city:"Monterrey"},
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
  {id:20, home:"Áustria",           away:"Jordânia",           group:"J", date:"2026-06-17T01:00", city:"São Francisco"},
  {id:19, home:"Argentina",         away:"Argélia",            group:"J", date:"2026-06-16T22:00", city:"Kansas City"},
  {id:43, home:"Argentina",         away:"Áustria",            group:"J", date:"2026-06-22T14:00", city:"Dallas"},
  {id:44, home:"Jordânia",          away:"Argélia",            group:"J", date:"2026-06-23T00:00", city:"São Francisco"},
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
  // ELIMINATÓRIAS
  {id:73, home:"África do Sul",away:"Canadá",group:"16avos",date:"2026-06-28T16:00",city:"Los Angeles",knockout:true},
  {id:74, home:"Brasil",away:"Japão",group:"16avos",date:"2026-06-29T14:00",city:"Houston",knockout:true},
  {id:75, home:"Alemanha",away:"Paraguai",group:"16avos",date:"2026-06-29T17:30",city:"Boston",knockout:true},
  {id:76, home:"Holanda",away:"Marrocos",group:"16avos",date:"2026-06-29T22:00",city:"Monterrey",knockout:true},
  {id:77, home:"Costa do Marfim",away:"Noruega",group:"16avos",date:"2026-06-30T14:00",city:"Dallas",knockout:true},
  {id:78, home:"França",away:"Suécia",group:"16avos",date:"2026-06-30T18:00",city:"Nova Jersey",knockout:true},
  {id:79, home:"México",away:"Equador",group:"16avos",date:"2026-06-30T22:00",city:"Cidade do México",knockout:true},
  {id:80, home:"Inglaterra",away:"RD Congo",group:"16avos",date:"2026-07-01T13:00",city:"Atlanta",knockout:true},
  {id:81, home:"Bélgica",away:"Senegal",group:"16avos",date:"2026-07-01T17:00",city:"Seattle",knockout:true},
  {id:82, home:"EUA",away:"Bósnia-Herzegovina",group:"16avos",date:"2026-07-01T21:00",city:"Santa Clara",knockout:true},
  {id:83, home:"Espanha",away:"Áustria",group:"16avos",date:"2026-07-02T16:00",city:"Los Angeles",knockout:true},
  {id:84, home:"Portugal",away:"Croácia",group:"16avos",date:"2026-07-02T20:00",city:"Toronto",knockout:true},
  {id:85, home:"Suíça",away:"Argélia",group:"16avos",date:"2026-07-03T00:00",city:"Vancouver",knockout:true},
  {id:86, home:"Austrália",away:"Egito",group:"16avos",date:"2026-07-03T15:00",city:"Atlanta",knockout:true},
  {id:87, home:"Argentina",away:"Cabo Verde",group:"16avos",date:"2026-07-03T19:00",city:"Kansas City",knockout:true},
  {id:88, home:"Colômbia",away:"Gana",group:"16avos",date:"2026-07-03T22:30",city:"Kansas City",knockout:true},
  {id:89, home:"Canadá",away:"Marrocos",group:"Oitavas",date:"2026-07-04T14:00",city:"Houston",knockout:true},
  {id:90, home:"Paraguai",away:"França",group:"Oitavas",date:"2026-07-04T18:00",city:"Filadélfia",knockout:true},
  {id:91, home:"Brasil",away:"Noruega",group:"Oitavas",date:"2026-07-05T17:00",city:"Nova Jersey",knockout:true},
  {id:92, home:"México",away:"Inglaterra",group:"Oitavas",date:"2026-07-05T21:00",city:"Cidade do México",knockout:true},
  {id:93, home:"Espanha",away:"Portugal",group:"Oitavas",date:"2026-07-06T16:00",city:"Dallas",knockout:true},
  {id:94, home:"Bélgica",away:"EUA",group:"Oitavas",date:"2026-07-06T21:00",city:"Seattle",knockout:true},
  {id:95, home:"Argentina",away:"Egito",group:"Oitavas",date:"2026-07-07T13:00",city:"Atlanta",knockout:true},
  {id:96, home:"Suíça",away:"Colômbia",group:"Oitavas",date:"2026-07-07T17:00",city:"Vancouver",knockout:true},
  {id:97, home:"França",away:"Marrocos",group:"Quartas",date:"2026-07-09T17:00",city:"Boston",knockout:true},
  {id:98, home:"Espanha",away:"Bélgica",group:"Quartas",date:"2026-07-10T16:00",city:"Los Angeles",knockout:true},
  {id:99, home:"Noruega",away:"Inglaterra",group:"Quartas",date:"2026-07-11T18:00",city:"Miami",knockout:true},
  {id:100,home:"Argentina",away:"Suíça",group:"Quartas",date:"2026-07-11T22:00",city:"Kansas City",knockout:true},
  {id:101,home:"França",away:"Espanha",group:"Semifinal",date:"2026-07-14T16:00",city:"Dallas",knockout:true},
  {id:102,home:"Inglaterra",away:"Argentina",group:"Semifinal",date:"2026-07-15T16:00",city:"Atlanta",knockout:true},
  {id:103,home:"L101",away:"L102",group:"3Lugar",date:"2026-07-18T17:00",city:"Miami",knockout:true},
  {id:104,home:"W101",away:"W102",group:"Final",date:"2026-07-19T16:00",city:"Nova Jersey",knockout:true},
];

const GROUPS = [...new Set(SCHEDULE.filter(g=>!g.knockout).map(g=>g.group))].sort();

const fmtDate = iso => new Date(iso+":00-03:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(".","");
const fmtTime = iso => new Date(iso+":00-03:00").toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+"h";
const isPast  = iso => new Date(iso+":00-03:00") < new Date();
const isToday = iso => new Date(iso+":00-03:00").toDateString()===new Date().toDateString();

function calcPoints(g, r, fase) {
  if (!g||!r) return null;
  const gh=parseInt(g.home),ga=parseInt(g.away),rh=parseInt(r.home),ra=parseInt(r.away);
  if (isNaN(gh)||isNaN(ga)||isNaN(rh)||isNaN(ra)) return null;

  const isKnockout = fase && fase!=="Todos" && !/^[A-L]$/.test(fase);

  // Multiplicador por fase: Semifinal e Final = dobro
  const isSemiFinal = fase==="Semifinal" || fase==="3Lugar" || fase==="Final";
  const mult = isSemiFinal ? 2 : 1;

  if (isKnockout) {
    // ══ TABELA DE PONTUAÇÃO DO MATA-MATA ══════════════════════════════════
    // Placar exato (não-empate, ex: 2x1 = 2x1)          → 6 pts
    // Placar exato empatado (1x1=1x1) + acertou pênaltis → 7 pts (6+1)
    // Placar exato empatado (1x1=1x1) sem pênaltis        → 6 pts
    // Apostou empate + acertou pênaltis (placar diferente) → 6 pts (3+3 bônus)
    // Apostou só empate (sem pênaltis ou errou pênaltis)   → 3 pts
    // Apostou vencedor direto, jogo foi a pênaltis, time ganhou → 1 pt
    // Apostou vencedor direto e acertou (jogo não empatou) → 3 pts
    // Errou                                                → 0 pts
    // ══════════════════════════════════════════════════════════════════════

    const placarExato   = gh===rh && ga===ra;
    const empatePalpite = gh===ga;
    const empateReal    = rh===ra;
    const acertouPenaltis = g.quemPassa && r.quemPassa && g.quemPassa===r.quemPassa;

    // 1. Placar exato
    if (placarExato) {
      if (empatePalpite && empateReal) {
        // Empate exato: bônus pênaltis = +mult
        return acertouPenaltis ? 6*mult+mult : 6*mult;
      }
      return 6*mult; // placar exato não-empate
    }

    // 2. Não acertou o placar exato
    if (empatePalpite) {
      // Apostou empate
      if (empateReal) {
        // Acertou empate (3*mult) + bônus pênaltis (+mult = 4*mult total)
        return acertouPenaltis ? 4*mult : 3*mult;
      } else {
        // Apostou empate mas não empatou — 1*mult se acertou vencedor via quemPassa
        const vencedorReal = rh>ra ? "home" : "away";
        return (g.quemPassa && g.quemPassa===vencedorReal) ? 1*mult : 0;
      }
    } else {
      // Apostou vencedor direto (não-empate)
      const vencedorPalpite = gh>ga ? "home" : "away";
      if (empateReal) {
        // Jogo foi a pênaltis — 1*mult se o time apostado ganhou nos pênaltis
        return (r.quemPassa && r.quemPassa===vencedorPalpite) ? 1*mult : 0;
      } else {
        // Jogo não empatou — 3*mult se acertou o vencedor
        const vencedorReal = rh>ra ? "home" : "away";
        return vencedorPalpite===vencedorReal ? 3*mult : 0;
      }
    }
  }

  // Fase de grupos: pontuação clássica
  if (gh===rh&&ga===ra) return 3;
  return (gh>ga?"H":gh<ga?"A":"D")===(rh>ra?"H":rh<ra?"A":"D")?1:0;
}

const BRACKET = {
  73:{winSlot:{id:90,side:"home"},loseSlot:null},74:{winSlot:{id:89,side:"home"},loseSlot:null},
  75:{winSlot:{id:90,side:"away"},loseSlot:null},76:{winSlot:{id:91,side:"home"},loseSlot:null},
  77:{winSlot:{id:89,side:"away"},loseSlot:null},78:{winSlot:{id:91,side:"away"},loseSlot:null},
  79:{winSlot:{id:92,side:"home"},loseSlot:null},80:{winSlot:{id:92,side:"away"},loseSlot:null},
  81:{winSlot:{id:94,side:"away"},loseSlot:null},82:{winSlot:{id:94,side:"home"},loseSlot:null},
  83:{winSlot:{id:93,side:"home"},loseSlot:null},84:{winSlot:{id:93,side:"away"},loseSlot:null},
  85:{winSlot:{id:96,side:"home"},loseSlot:null},86:{winSlot:{id:95,side:"home"},loseSlot:null},
  87:{winSlot:{id:96,side:"away"},loseSlot:null},88:{winSlot:{id:95,side:"away"},loseSlot:null},
  89:{winSlot:{id:97,side:"home"},loseSlot:null},90:{winSlot:{id:97,side:"away"},loseSlot:null},
  91:{winSlot:{id:99,side:"home"},loseSlot:null},92:{winSlot:{id:99,side:"away"},loseSlot:null},
  93:{winSlot:{id:98,side:"home"},loseSlot:null},94:{winSlot:{id:98,side:"away"},loseSlot:null},
  95:{winSlot:{id:100,side:"home"},loseSlot:null},96:{winSlot:{id:100,side:"away"},loseSlot:null},
  97:{winSlot:{id:101,side:"home"},loseSlot:null},98:{winSlot:{id:101,side:"away"},loseSlot:null},
  99:{winSlot:{id:102,side:"home"},loseSlot:null},100:{winSlot:{id:102,side:"away"},loseSlot:null},
  101:{winSlot:{id:104,side:"home"},loseSlot:{id:103,side:"home"}},
  102:{winSlot:{id:104,side:"away"},loseSlot:{id:103,side:"away"}},
};

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const BASE_BG = {
  minHeight:"100vh",
  background:"radial-gradient(ellipse at 30% 0%,#003d1a 0%,#001a0a 40%,#050d1a 70%,#000509 100%)",
  fontFamily:"'Bebas Neue',Impact,sans-serif",color:"#fff"
};
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
  html { lang: pt-BR; }
  *{box-sizing:border-box;} input,select,button,textarea{font-family:inherit;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(#009c3b,#002776);border-radius:3px;}
  @keyframes pop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(255,223,0,.3)}50%{text-shadow:0 0 40px rgba(255,223,0,.7)}}
  .hbtn:hover{transform:translateY(-2px)!important;filter:brightness(1.1)!important;}
  @keyframes upgradePulse{0%,100%{box-shadow:0 0 8px rgba(200,162,0,.3)}50%{box-shadow:0 0 20px rgba(200,162,0,.7)}}
  .hbtn{transition:all .2s ease!important;}
  input:focus,textarea:focus{outline:none;}
  input[type=number]::-webkit-inner-spin-button{opacity:.5;}
  /* Forçar português no corretor ortográfico */
  input, textarea { lang: pt-BR; }
`;

// Notificação flutuante
const Notif = ({n}) => n ? (
  <div style={{position:"fixed",top:16,right:16,zIndex:9999,animation:"pop .3s ease",
    background:n.type==="err"?"#7a1010":n.type==="warn"?"#7a5000":"#005a22",
    color:"#fff",padding:"10px 18px",borderRadius:8,fontFamily:"sans-serif",
    fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,.7)",maxWidth:320}}>
    {n.msg}
  </div>
) : null;

// Faixa BR
const BrStripe = () => (
  <div style={{height:4,background:"linear-gradient(90deg,#009c3b 33%,#ffdf00 33% 66%,#002776 66%)"}}/>
);

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
function AppInner() {
  const [db, setDb] = useState(null);

  // Detecta o slug da URL: bolao-do-gestor.vercel.app/SLUG
  const slug = window.location.pathname.replace(/^\/+|\/+$/g,"").toLowerCase() || "";

  // Dados Firebase
  const [admins,    setAdmins]    = useState({});
  const [allBoloes, setAllBoloes] = useState({});
  const [members,   setMembers]   = useState({});
  const [guesses,   setGuesses]   = useState({});
  const [results,   setResults]   = useState({});
  const [licencas,  setLicencas]  = useState({});
  const [dataReady, setDataReady] = useState(false); // true após 1ª carga do Firebase

  // UI global
  const [notification, setNotif] = useState(null);
  const notify = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3500); };

  // Auth
  const [masterUnlocked, setMasterUnlocked] = useState(false);
  const [currentAdmin,   setCurrentAdminState]   = useState(()=>{
    try { return JSON.parse(localStorage.getItem("bg26_admin")||"null"); } catch { return null; }
  });
  const setCurrentAdmin = (val) => {
    setCurrentAdminState(val);
    if (val) localStorage.setItem("bg26_admin", JSON.stringify(val));
    else localStorage.removeItem("bg26_admin");
  };
  const [currentMember,  setCurrentMember]  = useState(null); // { uid, apelido, bolaoId, adminSlug }

  // Init Firebase
  useEffect(() => {
    const app = initializeApp(FIREBASE_CONFIG);
    const database = getDatabase(app);
    setDb(database);
  }, []);

  // Listeners — dataReady vira true após admins responder (ou timeout 3s)
  useEffect(() => {
    if (!db) return;
    const paths = [
      ["admins",   setAdmins],
      ["boloes",   setAllBoloes],
      ["members",  setMembers],
      ["guesses",  setGuesses],
      ["results",  setResults],
      ["licencas", setLicencas],
    ];
    // Garante dataReady após admins carregar (coleção mais crítica)
    let adminLoaded = false;
    const timer = setTimeout(() => setDataReady(true), 3000); // fallback 3s
    paths.forEach(([path, setter]) => {
      onValue(dbRef(db, path), s => {
        setter(s.val()||{});
        if (path === "admins" && !adminLoaded) {
          adminLoaded = true;
          clearTimeout(timer);
          setDataReady(true);
        }
      });
    });
    return () => {
      clearTimeout(timer);
      paths.forEach(([path]) => off(dbRef(db, path)));
    };
  }, [db]);

  // Tela de carregamento: aguarda DB + 1ª resposta do Firebase
  if (!db || !dataReady) return (
    <div style={{...BASE_BG,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{fontSize:48,animation:"float 1.5s ease-in-out infinite"}}>⚽</div>
      <div style={{color:"#ffdf00",fontSize:20,letterSpacing:4,fontFamily:"sans-serif"}}>Carregando...</div>
    </div>
  );

  // ── Roteamento por slug ───────────────────────────────────────────────────
  if (slug === "master") {
    return <MasterPanel db={db} admins={admins} licencas={licencas}
      allBoloes={allBoloes} members={members} results={results}
      notify={notify} notification={notification}/>;
  }

  if (slug && admins[slug]) {
    const adminData = admins[slug];
    const meusBoloes = Object.entries(allBoloes)
      .filter(([,b])=>b.adminSlug===slug)
      .reduce((acc,[k,v])=>({...acc,[k]:v}),{});

    // Admin logado → Painel Admin
    if (currentAdmin?.slug === slug) {
      return <AdminPainelScreen
        db={db} adminData={adminData} adminSlug={slug}
        setCurrentAdmin={setCurrentAdmin}
        boloes={meusBoloes} members={members} guesses={guesses} results={results}
        notify={notify} notification={notification}/>;
    }

    // Participante logado → Tela do Bolão
    if (currentMember?.adminSlug === slug) {
      return <BolaoScreen
        db={db} adminData={adminData} adminSlug={slug}
        currentMember={currentMember} setCurrentMember={setCurrentMember}
        boloes={meusBoloes} members={members} guesses={guesses} results={results}
        notify={notify} notification={notification}/>;
    }

    // Tela de login (participante ou admin)
    return <ParticipanteLogin
      db={db} adminData={adminData} adminSlug={slug}
      boloes={meusBoloes} members={members}
      setCurrentMember={setCurrentMember}
      setCurrentAdmin={setCurrentAdmin}
      admins={admins}
      notify={notify} notification={notification}/>;
  }

  // Slug na URL mas não encontrado no Firebase → página não encontrada
  if (slug) return (
    <div style={{...BASE_BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:16}}>
      <style>{GLOBAL_CSS}</style>
      <BrStripe/>
      <div style={{fontSize:48}}>🔍</div>
      <div style={{fontSize:28,letterSpacing:4,color:"#ffdf00"}}>Bolão não encontrado</div>
      <div style={{fontFamily:"sans-serif",fontSize:14,color:"#888",textAlign:"center",maxWidth:320}}>
        O link <strong style={{color:"#fff"}}>/{slug}</strong> não existe ou ainda não foi criado.
      </div>
      <button onClick={()=>{ window.location.href="/"; }}
        style={{marginTop:8,background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
          border:"none",borderRadius:10,padding:"12px 28px",fontSize:16,letterSpacing:2,cursor:"pointer"}}>
        ← Ir para o início
      </button>
    </div>
  );

  return <HomeScreen
    db={db} admins={admins} licencas={licencas}
    currentAdmin={currentAdmin} setCurrentAdmin={setCurrentAdmin}
    notify={notify} notification={notification}/>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME — cadastro/login do administrador  (visual Copa 2026)
// ══════════════════════════════════════════════════════════════════════════════
function HomeScreen({db, admins, licencas, currentAdmin, setCurrentAdmin, notify, notification}) {
  const [tab, setTab]             = useState(null); // null=hero | entrar | gratis | pago
  const [slug, setSlug]           = useState("");
  const [senha, setSenha]         = useState("");
  const [showSenhaLogin, setShowSenhaLogin] = useState(false);
  const [licenca, setLicenca]     = useState("");
  const [nome, setNome]           = useState("");
  const [whatsapp, setWhatsapp]   = useState("");
  const [email, setEmail]         = useState("");
  const [profissao, setProfissao] = useState("");
  const [novoSlug, setNovoSlug]   = useState("");
  const [nomeBolao, setNomeBolao] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [err, setErr]             = useState("");
  const [esqueciAdmin, setEsqueciAdmin] = useState(false);
  const [slugRecuperar, setSlugRecuperar] = useState("");
  const [msgRecuperar, setMsgRecuperar]   = useState("");

  async function handleLogin() {
    setErr("");
    const s = safeKey(slug.trim());
    if (!s) { setErr("Digite seu link de acesso."); return; }
    if (!admins[s]) { setErr("Administrador não encontrado."); return; }
    if (admins[s].senha !== senha) { setErr("Senha incorreta."); return; }
    setCurrentAdmin({slug:s, ...admins[s]});
    setTimeout(()=>{ window.location.href = "/"+s; }, 100);
  }

  function handleRecuperarSenha() {
    const s = safeKey(slugRecuperar.trim());
    if (!s || !admins[s]) { setMsgRecuperar("Link não encontrado. Verifique e tente novamente."); return; }
    setMsgRecuperar(`✅ Olá, ${admins[s].nome}! Sua senha é: "${admins[s].senha}"\n\nGuarde-a em lugar seguro.`);
  }

  async function handleCadastroGratis() {
    setErr("");
    const s = safeKey(novoSlug.trim());
    if (!s || s.length < 3) { setErr("Link muito curto. Mínimo 3 caracteres."); return; }
    if (!nome.trim())        { setErr("Digite seu nome completo."); return; }
    if (!whatsapp.trim())    { setErr("Digite seu WhatsApp com DDD."); return; }
    if (!email.trim())       { setErr("Digite seu e-mail."); return; }
    if (!novaSenha || novaSenha.length < 6) { setErr("Senha deve ter pelo menos 6 caracteres."); return; }
    if (admins[s])           { setErr("Esse link já foi usado, por favor crie outro."); return; }
    if (s === "master")      { setErr("Este link é reservado. Escolha outro."); return; }
    if (!nomeBolao.trim()) { setErr("Digite o nome do seu bolão."); return; }
    try {
      const agora = new Date().toISOString();
      await set(dbRef(db, `admins/${s}`), {
        nome:nome.trim(), slug:s, senha:novaSenha,
        whatsapp:whatsapp.trim(), email:email.trim(), profissao:profissao.trim(),
        plano:"gratis", criadoEm:agora, ativo:true,
      });
      await set(dbRef(db, `master/leads/${s}`), {
        nome:nome.trim(), whatsapp:whatsapp.trim(), email:email.trim(),
        profissao:profissao.trim(), nomeBolao:nomeBolao.trim(),
        slug:s, plano:"gratis", criadoEm:agora, origem:"cadastro_gratis",
      });
      const bolaoId = safeKey(nomeBolao.trim())+"_"+Date.now();
      await set(dbRef(db, `boloes/${bolaoId}`), {
        nome:nomeBolao.trim(), descricao:"Copa do Mundo 2026",
        adminSlug:s, ativo:true, criadoEm:new Date().toISOString(),
        regras:{placarExato:3, acertouVencedor:1}, premio:"",
      });
      const adminObj = {slug:s, nome:nome.trim(), senha:novaSenha, plano:"gratis", ativo:true};
      setCurrentAdmin(adminObj);
      localStorage.setItem("bg26_admin", JSON.stringify(adminObj));
      notify("🎉 Bem-vindo! Conta e bolão criados com sucesso!");
      setTimeout(()=>{ window.location.href = "/"+s; }, 2500);
    } catch { setErr("Erro ao cadastrar. Tente novamente."); }
  }

  async function handleCadastroPago() {
    setErr("");
    const s = safeKey(novoSlug.trim());
    if (!s || s.length < 3) { setErr("Link muito curto. Mínimo 3 caracteres."); return; }
    if (!nome.trim())        { setErr("Digite seu nome."); return; }
    if (!novaSenha || novaSenha.length < 6) { setErr("Senha deve ter pelo menos 6 caracteres."); return; }
    if (!licenca.trim())     { setErr("Digite o código de licença."); return; }
    if (admins[s])           { setErr("Esse nome já foi usado, por favor crie outro."); return; }
    if (s === "master")      { setErr("Este link é reservado. Escolha outro."); return; }
    const lic = Object.entries(licencas).find(([,l])=>l.codigo===licenca.trim().toUpperCase()&&!l.usado);
    if (!lic) { setErr("Código de licença inválido ou já utilizado."); return; }
    const plano = lic[1].plano || "premium";
    try {
      const agora2 = new Date().toISOString();
      await set(dbRef(db, `admins/${s}`), {
        nome:nome.trim(), slug:s, senha:novaSenha,
        licenca:licenca.trim().toUpperCase(),
        plano, criadoEm:agora2, ativo:true,
      });
      await update(dbRef(db, `licencas/${lic[0]}`), {usado:true, adminSlug:s, usadoEm:agora2});
      await set(dbRef(db, `master/leads/${s}`), {
        nome:nome.trim(), slug:s, plano,
        licenca:licenca.trim().toUpperCase(),
        criadoEm:agora2, origem:"cadastro_pago",
      });
      const adminObj2 = {slug:s, nome:nome.trim(), senha:novaSenha, plano, ativo:true};
      setCurrentAdmin(adminObj2);
      localStorage.setItem("bg26_admin", JSON.stringify(adminObj2));
      notify("✅ Cadastro realizado! Redirecionando...");
      setTimeout(()=>{ window.location.href = "/"+s; }, 2500);
    } catch { setErr("Erro ao cadastrar. Tente novamente."); }
  }

  const inp = (placeholder, value, onChange, type="text") => (
    <input type={type} placeholder={placeholder} value={value} onChange={e=>{onChange(e.target.value);setErr("");}}
      style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",
        borderRadius:8,padding:"11px 14px",fontSize:14,fontFamily:"sans-serif",marginBottom:10}}/>
  );

  // ── HERO (tela inicial com os 4 botões) ────────────────────────────────────
  const heroCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700;900&display=swap');
    @keyframes heroPulse{0%,100%{opacity:1}50%{opacity:.25}}
    @keyframes heroFadeDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes heroFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .hbtn-grid{position:relative;background:rgba(255,255,255,.95);border:none;border-radius:16px;
      cursor:pointer;font-family:'Montserrat',sans-serif;overflow:hidden;
      transition:transform .18s ease,box-shadow .18s ease;
      box-shadow:0 6px 28px rgba(0,0,0,.4);padding:20px 14px 18px;
      display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;}
    .hbtn-grid:hover{transform:translateY(-4px);box-shadow:0 14px 38px rgba(0,0,0,.55);background:#fff;}
    .hbtn-grid:active{transform:scale(.97);}
    .hbtn-grid::after{content:"";position:absolute;bottom:0;left:0;right:0;height:4px;border-radius:0 0 16px 16px;}
    .hb1::after{background:linear-gradient(90deg,#009639,#00c853);}
    .hb2::after{background:linear-gradient(90deg,#002776,#1a5fc8);}
    .hb3::after{background:linear-gradient(90deg,#cc8800,#FFD700);}
    .hb4::after{background:linear-gradient(90deg,#880000,#cc0000);}
    .hero-badge-dot{width:7px;height:7px;border-radius:50%;background:#FFD700;animation:heroPulse 1.4s infinite;}
  `;

  if (tab === null) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",background:"#012a1a"}}>
      <style>{heroCSS}</style>
      <style>{GLOBAL_CSS}</style>
      <Notif n={notification}/>

      {/* Fundo: gradiente Copa + overlay */}
      <div style={{position:"absolute",inset:0,zIndex:0,
        background:"radial-gradient(ellipse at 50% 0%,#003d1a 0%,#001a0a 40%,#050d1a 70%,#000509 100%)"}}/>
      {/* Overlay verde escuro */}
      <div style={{position:"absolute",inset:0,zIndex:1,
        background:"linear-gradient(to bottom,rgba(0,15,8,.60) 0%,rgba(0,18,10,.50) 45%,rgba(0,8,4,.82) 100%)"}}/>

      {/* Faixa BR topo */}
      <div style={{position:"relative",zIndex:10}}>
        <BrStripe/>
      </div>

      {/* Conteúdo central */}
      <div style={{position:"relative",zIndex:10,flex:1,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",padding:"28px 22px 32px"}}>

        {/* Título */}
        <div style={{fontFamily:"'Bebas Neue',sans-serif",
          fontSize:"clamp(38px,9vw,60px)",color:"#FFD700",
          letterSpacing:3,textAlign:"center",lineHeight:1.05,
          textShadow:"0 0 40px rgba(255,215,0,.55),0 2px 0 rgba(0,0,0,.4)",
          marginBottom:4,animation:"heroFadeDown .7s ease both"}}>
          Bolão dos<br/>Amigos &amp; Família
        </div>

        {/* Sub */}
        <div style={{fontSize:11,color:"rgba(255,255,255,.72)",letterSpacing:4,
          textTransform:"uppercase",textAlign:"center",marginBottom:8,
          fontFamily:"'Montserrat',sans-serif",animation:"heroFadeDown .7s ease .1s both"}}>
          Copa do Mundo 2026
        </div>

        {/* Badge ao vivo */}
        <div style={{display:"inline-flex",alignItems:"center",gap:7,
          background:"rgba(255,215,0,.12)",border:"1px solid rgba(255,215,0,.35)",
          borderRadius:100,padding:"5px 14px",marginBottom:32,
          fontSize:11,color:"#FFD700",fontWeight:700,letterSpacing:1.2,
          fontFamily:"'Montserrat',sans-serif",animation:"heroFadeDown .7s ease .15s both"}}>
          <div className="hero-badge-dot"/>
          🇺🇸 🇲🇽 🇨🇦 &nbsp;·&nbsp; 48 Seleções &nbsp;·&nbsp; 104 Jogos
        </div>

        {/* Grid 4 botões */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,
          width:"100%",maxWidth:460,animation:"heroFadeUp .7s ease .25s both"}}>

          <button className="hbtn-grid hb1" onClick={()=>setTab("gratis")}>
            <div style={{position:"absolute",top:9,right:9,background:"#009639",color:"#fff",
              fontSize:8,fontWeight:900,letterSpacing:1,padding:"2px 7px",
              borderRadius:100,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif"}}>Novo</div>
            <div style={{fontSize:34,lineHeight:1}}>🏆</div>
            <div style={{fontSize:11.5,fontWeight:800,color:"#012A1A",letterSpacing:.4,
              textTransform:"uppercase",lineHeight:1.3,fontFamily:"'Montserrat',sans-serif"}}>
              Montar o Seu Bolão
            </div>
            <div style={{fontSize:9.5,color:"#555",fontWeight:500,lineHeight:1.3,
              fontFamily:"'Montserrat',sans-serif"}}>Crie e configure seu grupo</div>
          </button>

          <button className="hbtn-grid hb2" onClick={()=>setTab("entrar")}>
            <div style={{fontSize:34,lineHeight:1}}>⚽</div>
            <div style={{fontSize:11.5,fontWeight:800,color:"#012A1A",letterSpacing:.4,
              textTransform:"uppercase",lineHeight:1.3,fontFamily:"'Montserrat',sans-serif"}}>
              Entrar no Bolão
            </div>
            <div style={{fontSize:9.5,color:"#555",fontWeight:500,lineHeight:1.3,
              fontFamily:"'Montserrat',sans-serif"}}>Acesse com seu link e senha</div>
          </button>

          <button className="hbtn-grid hb3" onClick={()=>{ window.location.href="/tabela" || notify("Em breve: Tabela de Jogos 📅"); }}>
            <div style={{fontSize:34,lineHeight:1}}>📅</div>
            <div style={{fontSize:11.5,fontWeight:800,color:"#012A1A",letterSpacing:.4,
              textTransform:"uppercase",lineHeight:1.3,fontFamily:"'Montserrat',sans-serif"}}>
              Tabela dos Jogos
            </div>
            <div style={{fontSize:9.5,color:"#555",fontWeight:500,lineHeight:1.3,
              fontFamily:"'Montserrat',sans-serif"}}>Veja jogos e resultados</div>
          </button>

          <button className="hbtn-grid hb4" onClick={()=>setTab("pago")}>
            <div style={{fontSize:34,lineHeight:1}}>🔐</div>
            <div style={{fontSize:11.5,fontWeight:800,color:"#012A1A",letterSpacing:.4,
              textTransform:"uppercase",lineHeight:1.3,fontFamily:"'Montserrat',sans-serif"}}>
              Área do Administrador
            </div>
            <div style={{fontSize:9.5,color:"#555",fontWeight:500,lineHeight:1.3,
              fontFamily:"'Montserrat',sans-serif"}}>Gerencie bolões e aprovações</div>
          </button>

        </div>

        {/* Footer */}
        <div style={{marginTop:24,textAlign:"center",fontSize:10,
          color:"rgba(255,255,255,.28)",letterSpacing:.5,fontFamily:"'Montserrat',sans-serif",
          animation:"heroFadeUp .7s ease .4s both"}}>
          Desenvolvido por <span style={{color:"rgba(255,215,0,.5)",fontWeight:700}}>Instituto Isaac Martins</span> &nbsp;·&nbsp; 2026
        </div>
      </div>

      {/* Faixa BR rodapé */}
      <div style={{position:"relative",zIndex:10}}>
        <BrStripe/>
      </div>
    </div>
  );

  // ── FORMULÁRIOS (após escolha no hero) ────────────────────────────────────
  return (
    <div style={{...BASE_BG,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      <BrStripe/>
      <Notif n={notification}/>

      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 16px"}}>
        {/* Header compacto com botão voltar */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <button onClick={()=>{setTab(null);setErr("");}}
            style={{background:"transparent",border:"none",color:"rgba(255,255,255,.4)",
              cursor:"pointer",fontSize:12,fontFamily:"sans-serif",letterSpacing:1,
              marginBottom:12,textDecoration:"underline"}}>
            ← Voltar ao início
          </button>
          <div style={{fontSize:36,animation:"float 3s ease-in-out infinite",marginBottom:2}}>⚽</div>
          <div style={{fontSize:32,letterSpacing:6,lineHeight:1,
            background:"linear-gradient(135deg,#fff 30%,#ffdf00 70%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            BOLÃO DO GESTOR
          </div>
          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#ffdf00",letterSpacing:3,marginTop:4}}>
            By Prof. Isaac Martins · 🇧🇷 Copa do Mundo 2026
          </div>
        </div>

        <div style={{width:"100%",maxWidth:440}}>
          {/* Tabs de navegação */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:16}}>
            {[
              ["entrar",  "🔑 Entrar"],
              ["gratis",  "🆓 Grátis"],
              ["pago",    "⭐ Com Plano"],
            ].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");}}
                style={{background:tab===t?"linear-gradient(135deg,#009c3b,#006622)":"rgba(255,255,255,.06)",
                  color:"#fff",border:`2px solid ${tab===t?"#009c3b":"#333"}`,
                  borderRadius:10,padding:"10px 6px",cursor:"pointer",fontSize:13,fontWeight:700,transition:".2s"}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,223,0,.2)",borderRadius:14,padding:"22px"}}>

            {/* ── TAB ENTRAR ── */}
            {tab==="entrar"&&(<>
              <div style={{fontSize:20,letterSpacing:3,color:"#ffdf00",marginBottom:14}}>ACESSAR MEU PAINEL</div>
              {!esqueciAdmin?(<>
                {inp("Seu link (ex: joaosilva)", slug, setSlug)}
                <div style={{position:"relative",marginBottom:10}}>
                  <input type={showSenhaLogin?"text":"password"} placeholder="Sua senha" value={senha}
                    onChange={e=>{setSenha(e.target.value);setErr("");}}
                    onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                    style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",
                      borderRadius:8,padding:"11px 44px 11px 14px",fontSize:14,fontFamily:"sans-serif"}}/>
                  <button onClick={()=>setShowSenhaLogin(s=>!s)}
                    style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                      background:"transparent",border:"none",color:"#888",cursor:"pointer",fontSize:18}}>
                    {showSenhaLogin?"🙈":"👁️"}
                  </button>
                </div>
                {err&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:8}}>{err}</div>}
                <button onClick={handleLogin}
                  style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
                    border:"none",borderRadius:10,padding:"12px",fontSize:17,letterSpacing:3,cursor:"pointer",marginBottom:10}}>
                  ENTRAR ▶
                </button>
                <div style={{textAlign:"center"}}>
                  <button onClick={()=>{setEsqueciAdmin(true);setMsgRecuperar("");}}
                    style={{background:"transparent",border:"none",color:"#888",cursor:"pointer",
                      fontSize:12,fontFamily:"sans-serif",textDecoration:"underline"}}>
                    Esqueci minha senha
                  </button>
                </div>
              </>):(
                <div>
                  <div style={{fontSize:15,letterSpacing:2,color:"#ffdf00",marginBottom:8}}>🔑 RECUPERAR SENHA</div>
                  {inp("Seu link (ex: joaosilva)", slugRecuperar, setSlugRecuperar)}
                  {msgRecuperar&&(
                    <div style={{background:msgRecuperar.startsWith("✅")?"rgba(0,156,59,.15)":"rgba(120,16,16,.15)",
                      border:`1px solid ${msgRecuperar.startsWith("✅")?"#009c3b":"#5a1010"}`,
                      borderRadius:8,padding:"12px",fontFamily:"sans-serif",fontSize:13,
                      color:"#fff",marginBottom:10,whiteSpace:"pre-wrap",lineHeight:1.8}}>
                      {msgRecuperar}
                    </div>
                  )}
                  <button onClick={handleRecuperarSenha}
                    style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",
                      border:"none",borderRadius:8,padding:"11px",fontSize:15,letterSpacing:2,cursor:"pointer",marginBottom:8}}>
                    🔑 Recuperar Senha
                  </button>
                  <button onClick={()=>{setEsqueciAdmin(false);setMsgRecuperar("");setSlugRecuperar("");}}
                    style={{width:"100%",background:"transparent",color:"#777",border:"1px solid #333",
                      borderRadius:8,padding:"9px",cursor:"pointer",fontSize:13,fontFamily:"sans-serif"}}>
                    ← Voltar
                  </button>
                </div>
              )}
            </>)}

            {/* ── TAB GRÁTIS ── */}
            {tab==="gratis"&&(<>
              <div style={{background:"rgba(80,80,80,.2)",border:"1px solid #555",borderRadius:10,
                padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:32}}>🏆</div>
                <div>
                  <div style={{fontSize:16,letterSpacing:2,color:"#fff"}}>MONTAR MEU BOLÃO</div>
                  <div style={{fontFamily:"sans-serif",fontSize:12,color:"#aaa"}}>
                    1 bolão · até 5 participantes · sem custo
                  </div>
                </div>
              </div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:14,lineHeight:1.7}}>
                Crie sua conta grátis e comece agora! Ideal para testar com família ou amigos.
              </div>
              {inp("Nome completo *", nome, setNome)}
              {inp("WhatsApp com DDD *", whatsapp, setWhatsapp, "tel")}
              {inp("E-mail *", email, setEmail, "email")}
              {inp("Profissão (opcional)", profissao, setProfissao)}
              {inp("Nome do seu bolão * (ex: Bolão da Família)", nomeBolao, setNomeBolao)}
              {inp("Seu link exclusivo * (ex: joaosilva)", novoSlug, v=>setNovoSlug(v.replace(/\s/g,"").toLowerCase()))}
              {novoSlug&&(
                <div style={{fontFamily:"sans-serif",fontSize:11,marginTop:-8,marginBottom:8,
                  color:admins[safeKey(novoSlug)]?"#ff6b6b":"#009c3b"}}>
                  {admins[safeKey(novoSlug)]?"❌ Link já usado, escolha outro":`✅ bolao-do-gestor.vercel.app/${safeKey(novoSlug)}`}
                </div>
              )}
              <div style={{position:"relative",marginBottom:10}}>
                <input type={showNovaSenha?"text":"password"} placeholder="Crie uma senha (mín. 6 caracteres) *"
                  value={novaSenha} onChange={e=>{setNovaSenha(e.target.value);setErr("");}}
                  style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",
                    borderRadius:8,padding:"11px 44px 11px 14px",fontSize:14,fontFamily:"sans-serif"}}/>
                <button onClick={()=>setShowNovaSenha(s=>!s)}
                  style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                    background:"transparent",border:"none",color:"#888",cursor:"pointer",fontSize:18}}>
                  {showNovaSenha?"🙈":"👁️"}
                </button>
              </div>
              {err&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:8}}>{err}</div>}
              <button onClick={handleCadastroGratis}
                style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
                  border:"none",borderRadius:10,padding:"13px",fontSize:17,letterSpacing:2,
                  cursor:"pointer",marginBottom:10}}>
                🏆 CRIAR MEU BOLÃO GRÁTIS
              </button>
              <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:11,color:"#555"}}>
                Quer mais recursos?{" "}
                <button onClick={()=>{setTab("pago");setErr("");}}
                  style={{background:"none",border:"none",color:"#ffdf00",cursor:"pointer",fontSize:11,textDecoration:"underline"}}>
                  Ver planos pagos
                </button>
              </div>
            </>)}

            {/* ── TAB PAGO ── */}
            {tab==="pago"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {plano:"pro",     desc:"1 bolão · 50 pessoas"},
                  {plano:"premium", desc:"3 bolões · 50 pessoas cada"},
                ].map(p=>{
                  const pl = PLANOS[p.plano];
                  return(
                    <div key={p.plano} style={{background:pl.corBg,border:`2px solid ${pl.cor}`,
                      borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontSize:24}}>{pl.icon}</div>
                      <div style={{fontSize:14,letterSpacing:2,color:pl.cor,marginTop:4}}>{pl.nome}</div>
                      <div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa",marginTop:4}}>{p.desc}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:14,lineHeight:1.7}}>
                Insira seu <strong style={{color:"#ffdf00"}}>código de licença</strong> para ativar o plano Pro ou Premium.
                Entre em contato com o Prof. Isaac Martins para adquirir.
              </div>
              {inp("Código de licença *", licenca, v=>setLicenca(v.toUpperCase()))}
              {inp("Seu nome *", nome, setNome)}
              {inp("Seu link exclusivo * (ex: joaosilva)", novoSlug, v=>setNovoSlug(v.replace(/\s/g,"").toLowerCase()))}
              {novoSlug&&(
                <div style={{fontFamily:"sans-serif",fontSize:11,marginTop:-8,marginBottom:8,
                  color:admins[safeKey(novoSlug)]?"#ff6b6b":"#009c3b"}}>
                  {admins[safeKey(novoSlug)]?"❌ Link já usado, escolha outro":`✅ bolao-do-gestor.vercel.app/${safeKey(novoSlug)}`}
                </div>
              )}
              <div style={{position:"relative",marginBottom:10}}>
                <input type={showNovaSenha?"text":"password"} placeholder="Crie uma senha (mín. 6 caracteres) *"
                  value={novaSenha} onChange={e=>{setNovaSenha(e.target.value);setErr("");}}
                  style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",
                    borderRadius:8,padding:"11px 44px 11px 14px",fontSize:14,fontFamily:"sans-serif"}}/>
                <button onClick={()=>setShowNovaSenha(s=>!s)}
                  style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                    background:"transparent",border:"none",color:"#888",cursor:"pointer",fontSize:18}}>
                  {showNovaSenha?"🙈":"👁️"}
                </button>
              </div>
              {err&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:8}}>{err}</div>}
              <button onClick={handleCadastroPago}
                style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",
                  border:"none",borderRadius:10,padding:"13px",fontSize:17,letterSpacing:2,
                  cursor:"pointer",marginBottom:10}}>
                ⭐ ATIVAR MEU PLANO
              </button>
            </>)}

          </div>
        </div>
      </div>
      <BrStripe/>
      <div style={{textAlign:"center",padding:"10px",fontFamily:"sans-serif",fontSize:11,color:"#2a2a2a"}}>
        bolao-do-gestor.vercel.app · By Prof. Isaac Martins
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// LOGIN DO PARTICIPANTE — página exclusiva do admin (bolao.vercel.app/SLUG)
// ══════════════════════════════════════════════════════════════════════════════
function ParticipanteLogin({db, adminData, adminSlug, boloes, members,
  setCurrentMember, setCurrentAdmin, admins, notify, notification}) {
  const [selectedBolaoId, setSelectedBolaoId] = useState("");
  const [showAdminLogin, setShowAdminLogin]   = useState(false);
  const [adminSenha, setAdminSenha]           = useState("");
  const [showSenha, setShowSenha]             = useState(false);
  const [err, setErr]                         = useState("");
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [senhaInput, setSenhaInput]           = useState("");
  const [showSenhaParticipante, setShowSenhaParticipante] = useState(false);
  const [errSenha, setErrSenha]               = useState("");

  const boloesList = Object.entries(boloes).filter(([,b])=>b.ativo!==false);
  useEffect(()=>{ if(boloesList.length>0) setSelectedBolaoId(boloesList[0][0]); },[boloes]);

  const membrosAprovados = Object.entries(members[selectedBolaoId]||{})
    .filter(([,m])=>m.status==="aprovado").map(([uid,m])=>({uid,...m}));

  function entrar(m) {
    setSenhaInput("");
    setMembroSelecionado(m);
  }

  function confirmarEntrada() {
    if (!membroSelecionado) return;
    if (membroSelecionado.senha && senhaInput !== membroSelecionado.senha) {
      setErrSenha("Senha incorreta. Tente novamente.");
      return;
    }
    setCurrentMember({uid:membroSelecionado.uid, apelido:membroSelecionado.apelido, bolaoId:selectedBolaoId, adminSlug});
    notify(`⚽ Bem-vindo(a), ${membroSelecionado.apelido}!`);
  }

  function loginAdmin() {
    if (!adminSenha.trim()) { setErr("Digite sua senha."); return; }
    if (adminSenha !== admins[adminSlug]?.senha) {
      setErr("Senha incorreta. Tente novamente."); return;
    }
    // Salva no localStorage e recarrega para o roteamento funcionar
    const adminInfo = {slug:adminSlug, ...admins[adminSlug]};
    localStorage.setItem("bg26_admin", JSON.stringify(adminInfo));
    window.location.reload();
  }

  return (
    <div style={{...BASE_BG,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      <BrStripe/>
      <Notif n={notification}/>

      <header>
        <div style={{background:"linear-gradient(135deg,#004d22,#009c3b 25%,#002776 60%,#001240)"}}>
          <div style={{background:"rgba(0,0,0,.55)",padding:"14px 20px",textAlign:"center"}}>
            <div style={{fontSize:36,letterSpacing:6,textShadow:"0 0 20px rgba(255,223,0,.3)"}}>⚽ BOLÃO DO GESTOR</div>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#ffdf00",letterSpacing:3,marginTop:2}}>
              {adminData.nome} · 🇧🇷 Brasil Rumo ao Hexa
            </div>
          </div>
        </div>
        <BrStripe/>
      </header>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
        <div style={{width:"100%",maxWidth:440}}>

          {!showAdminLogin ? (<>
            {/* Seleção de bolão */}
            {boloesList.length > 1 && (
              <div style={{marginBottom:16}}>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:6}}>ESCOLHA O BOLÃO:</div>
                <div style={{display:"grid",gap:8}}>
                  {boloesList.map(([bid,b])=>(
                    <button key={bid} onClick={()=>setSelectedBolaoId(bid)} className="hbtn"
                      style={{background:selectedBolaoId===bid?"rgba(0,156,59,.2)":"rgba(255,255,255,.04)",
                        border:`2px solid ${selectedBolaoId===bid?"#009c3b":"#1a2a1a"}`,
                        borderRadius:10,padding:"12px 16px",cursor:"pointer",color:"#fff",
                        display:"flex",alignItems:"center",gap:12,transition:".2s"}}>
                      <span style={{fontSize:24}}>⚽</span>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontSize:16,letterSpacing:2}}>{b.nome}</div>
                        <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888"}}>{b.descricao}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {boloesList.length===1&&(
              <div style={{background:"rgba(0,156,59,.1)",border:"1px solid rgba(0,156,59,.3)",
                borderRadius:10,padding:"12px 16px",marginBottom:16,
                fontFamily:"sans-serif",fontSize:14,color:"#009c3b",fontWeight:700}}>
                ⚽ {boloesList[0][1].nome}
              </div>
            )}

            {/* Lista de participantes */}
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,223,0,.2)",borderRadius:14,padding:"20px"}}>
              <div style={{fontSize:18,letterSpacing:3,color:"#ffdf00",marginBottom:4}}>QUEM É VOCÊ?</div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:16}}>
                Clique no seu nome para entrar:
              </div>
              {membrosAprovados.length===0 ? (
                <div style={{textAlign:"center",padding:"20px",fontFamily:"sans-serif",color:"#555"}}>
                  Nenhum participante cadastrado ainda.
                </div>
              ) : membroSelecionado ? (
                /* Modal de senha */
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,padding:"10px",background:"rgba(0,156,59,.08)",borderRadius:10}}>
                    <MemberAvatar member={membroSelecionado} size={44}/>
                    <div>
                      <div style={{fontSize:18,letterSpacing:2}}>{membroSelecionado.apelido}</div>
                      <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>{membroSelecionado.nome}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:8}}>Digite sua senha para entrar:</div>
                  <div style={{position:"relative",marginBottom:8}}>
                    <input type={showSenhaParticipante?"text":"password"} placeholder="Sua senha" value={senhaInput}
                      onChange={e=>{setSenhaInput(e.target.value);setErrSenha("");}}
                      onKeyDown={e=>e.key==="Enter"&&confirmarEntrada()}
                      autoFocus
                      style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",
                        borderRadius:8,padding:"11px 44px 11px 14px",fontSize:16,fontFamily:"sans-serif"}}/>
                    <button onClick={()=>setShowSenhaParticipante(s=>!s)}
                      style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                        background:"transparent",border:"none",color:"#888",cursor:"pointer",fontSize:18}}>
                      {showSenhaParticipante?"🙈":"👁️"}
                    </button>
                  </div>
                  {errSenha&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:8}}>{errSenha}</div>}
                  <button onClick={confirmarEntrada}
                    style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
                      border:"none",borderRadius:10,padding:"12px",fontSize:16,letterSpacing:2,cursor:"pointer",marginBottom:8}}>
                    ENTRAR ⚽
                  </button>
                  <button onClick={()=>{setMembroSelecionado(null);setErrSenha("");setSenhaInput("");}}
                    style={{width:"100%",background:"transparent",color:"#777",border:"1px solid #333",
                      borderRadius:8,padding:"9px",cursor:"pointer",fontSize:13,fontFamily:"sans-serif"}}>
                    ← Escolher outro nome
                  </button>
                </div>
              ) : (
                <div style={{display:"grid",gap:10}}>
                  {membrosAprovados.map(m=>(
                    <button key={m.uid} onClick={()=>entrar(m)} className="hbtn"
                      style={{background:"rgba(255,255,255,.05)",border:"2px solid #1a3a1a",
                        borderRadius:12,padding:"14px 16px",cursor:"pointer",color:"#fff",
                        display:"flex",alignItems:"center",gap:14,textAlign:"left",width:"100%"}}>
                      <MemberAvatar member={m} size={48}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:20,letterSpacing:2}}>{m.apelido}</div>
                        <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>{m.nome}</div>
                      </div>
                      <div style={{fontSize:22,color:"#009c3b"}}>▶</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botão admin */}
            <div style={{textAlign:"center",marginTop:16}}>
              <button onClick={()=>setShowAdminLogin(true)}
                style={{background:"transparent",border:"1px solid #2a2a4a",color:"#6666aa",
                  borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,
                  fontFamily:"sans-serif",transition:".2s"}}>
                🔐 Sou o Administrador
              </button>
            </div>
          </>) : (<>
            {/* Login Admin */}
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,223,0,.2)",borderRadius:14,padding:"24px"}}>
              <div style={{fontSize:20,letterSpacing:3,color:"#ffdf00",marginBottom:16}}>🔐 ACESSO DO ADMINISTRADOR</div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:4}}>SENHA</div>
                <div style={{position:"relative"}}>
                  <input type={showSenha?"text":"password"} placeholder="Digite sua senha"
                    value={adminSenha} onChange={e=>{setAdminSenha(e.target.value);setErr("");}}
                    onKeyDown={e=>e.key==="Enter"&&loginAdmin()}
                    style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",
                      borderRadius:8,padding:"11px 44px 11px 14px",fontSize:16,fontFamily:"sans-serif"}}/>
                  <button onClick={()=>setShowSenha(s=>!s)}
                    style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                      background:"transparent",border:"none",color:"#888",cursor:"pointer",fontSize:18}}>
                    {showSenha?"🙈":"👁️"}
                  </button>
                </div>
              </div>
              {err&&<div style={{color:"#ff6b6b",fontSize:12,fontFamily:"sans-serif",marginBottom:10}}>{err}</div>}
              <button onClick={loginAdmin}
                style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
                  border:"none",borderRadius:10,padding:"13px",fontSize:17,letterSpacing:3,cursor:"pointer",marginBottom:10}}>
                ENTRAR ▶
              </button>
              <button onClick={()=>{setShowAdminLogin(false);setErr("");setAdminSenha("");}}
                style={{width:"100%",background:"transparent",color:"#777",border:"1px solid #333",
                  borderRadius:8,padding:"9px",cursor:"pointer",fontSize:13,fontFamily:"sans-serif"}}>
                ← Voltar
              </button>
            </div>
          </>)}
        </div>
      </div>
      <BrStripe/>
    </div>
  );
}

// ── Componentes utilitários globais (fora de qualquer função para evitar re-render) ──
const Card = ({children, color="#1a3a1a"}) => (
  <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${color}`,borderRadius:12,padding:"16px",marginBottom:14}}>
    {children}
  </div>
);
const Label = ({children}) => (
  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:5}}>{children}</div>
);
const AdminInput = ({value,onChange,placeholder,type="text"}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",
      borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"sans-serif"}}/>
);

// ══════════════════════════════════════════════════════════════════════════════
// PAINEL DO ADMINISTRADOR — tela completa após login admin
// ══════════════════════════════════════════════════════════════════════════════
function AdminPainelScreen({db, adminData, adminSlug, setCurrentAdmin,
  boloes, members, guesses, results, notify, notification}) {

  const [aba, setAba] = useState("boloes");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedBid, setSelectedBid] = useState(Object.keys(boloes)[0]||"");
  const [filterGrp, setFilterGrp] = useState("Todos");
  const [scheduleOverrides, setScheduleOverrides] = useState({});

  useEffect(()=>{
    if(!db) return;
    const r = dbRef(db,"schedule_overrides");
    onValue(r, s=>setScheduleOverrides(s.val()||{}));
    return ()=>off(r);
  },[db]);

  async function adminSaveGuess(uid, gameId, side, val) {
    const key = `${safeKey(adminSlug)}_${safeKey(selectedBid)}_${safeKey(uid)}`;
    await set(dbRef(db,`guesses/${key}/${gameId}/${side}`), val);
  }

  async function reprocessarChaveamento() {
    // Vencedores confirmados dos 16avos - atualizar conforme jogos terminam
    const vencedores16avos = {
      73: {home:"África do Sul", away:"Canadá",            winner:"away"}, // Canadá
      74: {home:"Brasil",        away:"Japão",              winner:"home"}, // Brasil
      75: {home:"Alemanha",      away:"Paraguai",           winner:"away"}, // Paraguai (pênaltis)
      76: {home:"Holanda",       away:"Marrocos",           winner:"away"}, // Marrocos (pênaltis)
      77: {home:"Costa do Marfim",away:"Noruega",           winner:"away"}, // Noruega
      78: {home:"França",        away:"Suécia",             winner:"home"}, // França
      79: {home:"México",        away:"Equador",            winner:"home"}, // México
      80: {home:"Inglaterra",    away:"RD Congo",           winner:"home"}, // Inglaterra
      81: {home:"Bélgica",       away:"Senegal",            winner:"home"}, // Bélgica
      82: {home:"EUA",           away:"Bósnia-Herzegovina", winner:"home"}, // EUA
      83: {home:"Espanha",       away:"Áustria",            winner:"home"}, // Espanha
      84: {home:"Portugal",      away:"Croácia",            winner:"home"}, // Portugal
      85: {home:"Suíça",         away:"Argélia",            winner:"home"}, // Suíça
      86: {home:"Austrália",     away:"Egito",              winner:"away"}, // Egito (pênaltis)
      87: {home:"Argentina",     away:"Cabo Verde",         winner:"home"}, // Argentina
      88: {home:"Colômbia",      away:"Gana",               winner:"home"}, // Colômbia
    };

    // Limpar overrides das oitavas (89-96) e quartas (97-100) - têm nomes definitivos
    for (let id = 89; id <= 100; id++) {
      await set(dbRef(db, `schedule_overrides/${id}`), null);
    }

    let count = 0;
    for (const [gameIdStr, info] of Object.entries(vencedores16avos)) {
      const gameId = parseInt(gameIdStr);
      const bracket = BRACKET[gameId];
      if (!bracket) continue;
      const winner = info.winner === "home" ? info.home : info.away;
      const loser  = info.winner === "home" ? info.away : info.home;
      // Só gravar overrides para semifinais em diante (id >= 101)
      if (bracket.winSlot && bracket.winSlot.id >= 101) {
        await set(dbRef(db, `schedule_overrides/${bracket.winSlot.id}/${bracket.winSlot.side}`), winner);
        count++;
      }
      if (bracket.loseSlot && loser && bracket.loseSlot.id >= 101) {
        await set(dbRef(db, `schedule_overrides/${bracket.loseSlot.id}/${bracket.loseSlot.side}`), loser);
        count++;
      }
    }
    notify(`✅ Chaveamento reprocessado! ${count} slots atualizados.`);
  }

  async function saveResultLocal(gameId, side, val) {
    await set(dbRef(db,`results/${gameId}/${side}`), val);

    const g = SCHEDULE.find(x=>x.id===gameId);
    if(!g?.knockout) return;
    const bracket = BRACKET[gameId];
    if(!bracket) return;

    const r = await new Promise(res=>{
      const ref = dbRef(db,`results/${gameId}`);
      onValue(ref, s=>{ off(ref); res(s.val()||{}); }, {onlyOnce:true});
    });

    const home = r.home, away = r.away;
    const hN = parseInt(home), aN = parseInt(away);
    let winner = null, loser = null;

    if(!isNaN(hN) && !isNaN(aN) && home!=="" && away!=="") {
      if(hN > aN) { winner = home; loser = away; }
      else if(aN > hN) { winner = away; loser = home; }
      else {
        if(side === "quemPassa") {
          winner = r.quemPassa==="home" ? home : r.quemPassa==="away" ? away : null;
          loser  = r.quemPassa==="home" ? away : r.quemPassa==="away" ? home : null;
        } else return;
      }
    }
    if(!winner || !winner.trim()) return;

    if(bracket.winSlot) {
      await set(dbRef(db,`schedule_overrides/${bracket.winSlot.id}/${bracket.winSlot.side}`), winner.trim());
    }
    if(bracket.loseSlot && loser && loser.trim()) {
      await set(dbRef(db,`schedule_overrides/${bracket.loseSlot.id}/${bracket.loseSlot.side}`), loser.trim());
    }
  }

  // Bolão atual
  const bolaoAtual = boloes[selectedBid]||{};
  const membrosDosBolao = Object.entries(members[selectedBid]||{}).map(([uid,m])=>({uid,...m}));
  const aprovados = membrosDosBolao.filter(m=>m.status==="aprovado");

  // Estados para criação de bolão
  const [newBNome, setNewBNome] = useState("");
  const [newBDesc, setNewBDesc] = useState("");

  // Estados participantes
  const [editM, setEditM]       = useState(null);
  const [editGuessUid, setEditGuessUid] = useState(null);
  const [newNome, setNewNome]   = useState("");
  const [newApe, setNewApe]     = useState("");
  const [newWa, setNewWa]       = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newSenha, setNewSenha] = useState("");
  const [newPontosExtras, setNewPontosExtras] = useState(0);

  // Estados regras e prêmio
  const [regras, setRegras]   = useState(()=>bolaoAtual.regras||{acerto3:3,acerto1:1,errouDesc:"0 pontos"});
  const [premio, setPremio]   = useState(()=>bolaoAtual.premio||"");

  // Estados avisos
  const [aviso, setAviso]     = useState("");
  const [avisos, setAvisos]   = useState([]);

  // Estados resultados
  const [apiKey, setApiKey]   = useState(localStorage.getItem("bg26_apikey")||"");
  const [fetching, setFetching] = useState(false);
  const [lastUp, setLastUp]   = useState(null);

  // Carregar avisos
  useEffect(()=>{
    if(!db||!selectedBid) return;
    const r = dbRef(db,`avisos/${selectedBid}`);
    onValue(r, s=>{
      const v=s.val()||{};
      setAvisos(Object.entries(v).map(([id,a])=>({id,...a})).sort((a,b)=>b.ts-a.ts));
    });
    return ()=>off(r);
  },[db,selectedBid]);

  // Atualizar regras quando muda bolão
  useEffect(()=>{
    setRegras(bolaoAtual.regras||{acerto3:3,acerto1:1,errouDesc:"0 pontos"});
    setPremio(bolaoAtual.premio||"");
  },[selectedBid,boloes]);

  const numBoloes = Object.keys(boloes).length;
  const { maxBoloes, maxMembros, plano } = getLimites(adminData);
  const planoInfo = PLANOS[plano]||PLANOS.gratis;

  const FILTER_OPTS = ["Todos","Hoje","16 Avos","Oitavas","Quartas","Semifinal","3º Lugar","Final"];

  function filteredGames() {
    return SCHEDULE.filter(g=>{
      if(filterGrp==="Todos") return g.knockout===true; // só mata-mata
      if(filterGrp==="Hoje") return isToday(g.date) && g.knockout===true;
      if(filterGrp==="16 Avos") return g.group==="16avos";
      if(filterGrp==="Oitavas") return g.group==="Oitavas";
      if(filterGrp==="Quartas") return g.group==="Quartas";
      if(filterGrp==="Semifinal") return g.group==="Semifinal";
      if(filterGrp==="3º Lugar") return g.group==="3Lugar";
      if(filterGrp==="Final") return g.group==="Final";
      return false;
    }).sort((a,b)=>a.date.localeCompare(b.date));
  }

  async function criarBolao() {
    if(!newBNome.trim()){notify("Digite o nome","err");return;}
    if(numBoloes>=maxBoloes){notify(`Limite de ${maxBoloes} bolões!`,"err");return;}
    const id=safeKey(newBNome)+"_"+Date.now();
    await set(dbRef(db,`boloes/${id}`),{
      nome:newBNome.trim(),descricao:newBDesc.trim()||"Copa do Mundo 2026",
      adminSlug,ativo:true,criadoEm:new Date().toISOString(),
      regras:{placarExato:3,acertouVencedor:1},premio:""
    });
    setNewBNome("");setNewBDesc("");
    setSelectedBid(id);
    notify(`✅ Bolão "${newBNome}" criado!`);
  }

  async function addMembro() {
    if(!newNome.trim()||!newApe.trim()){notify("Nome e apelido obrigatórios","err");return;}
    if(!newSenha.trim()){notify("Crie uma senha para o participante","err");return;}
    if(aprovados.length>=maxMembros){notify(`Limite de ${maxMembros}!`,"err");return;}
    const uid=safeKey(newApe.trim());
    if(members[selectedBid]?.[uid]){notify("Apelido já existe","err");return;}
    await set(dbRef(db,`members/${selectedBid}/${uid}`),{
      nome:newNome.trim(),apelido:newApe.trim(),
      whatsapp:newWa.trim(),email:newEmail.trim(),
      senha:newSenha.trim(),
      pontosExtras:newPontosExtras||0,
      status:"aprovado",criadoEm:new Date().toISOString()
    });
    setNewNome("");setNewApe("");setNewWa("");setNewEmail("");setNewSenha("");setNewPontosExtras(0);
    notify(`✅ ${newApe} adicionado!`);
  }

  async function salvarRegras() {
    await update(dbRef(db,`boloes/${selectedBid}`),{regras});
    notify("✅ Regras salvas!");
  }

  async function salvarPremio() {
    await update(dbRef(db,`boloes/${selectedBid}`),{premio});
    notify("✅ Prêmio salvo!");
  }

  async function enviarAviso() {
    if(!aviso.trim()){notify("Digite o aviso","err");return;}
    await push(dbRef(db,`avisos/${selectedBid}`),{
      texto:aviso.trim(),ts:Date.now(),
      data:new Date().toLocaleDateString("pt-BR")
    });
    setAviso("");
    notify("📢 Aviso enviado!");
  }

  async function fetchResultados() {
    setFetching(true);
    try {
      if(!apiKey){notify("Configure a chave de API","warn");setFetching(false);return;}
      const res=await fetch("https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED&season=2026",
        {headers:{"X-Auth-Token":apiKey}});
      if(!res.ok) throw new Error();
      const data=await res.json();
      for(const m of (data.matches||[])){
        const hn=(m.homeTeam?.shortName||"").toLowerCase().slice(0,4);
        const found=SCHEDULE.find(s=>s.home.toLowerCase().startsWith(hn));
        if(found&&m.score?.fullTime?.home!=null)
          await set(dbRef(db,`results/${found.id}`),{home:String(m.score.fullTime.home),away:String(m.score.fullTime.away)});
      }
      const t=new Date().toLocaleTimeString("pt-BR");
      setLastUp(t);notify("✅ Resultados atualizados!");
    } catch{notify("❌ Erro na API","err");}
    setFetching(false);
  }

  // Ranking
  function getRanking() {
    return aprovados.map(m=>{
      let pts=0,exact=0,win=0;
      SCHEDULE.forEach(g=>{
        const r=results[g.id];
        const key=`${safeKey(adminSlug)}_${safeKey(selectedBid)}_${safeKey(m.uid)}`;
        const gu=guesses[key]?.[g.id];
        if(r&&gu){const pt=calcPoints(gu,r,g.group);if(pt!=null){pts+=pt;if(pt===3)exact++;if(pt===1)win++;}}
      });
      return{...m,pts,exact,win};
    }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact||b.win-a.win);
  }

  const tabStyle = t => ({
    background:aba===t?"#ffdf00":"rgba(255,255,255,.07)",
    color:aba===t?"#000":"#aaa",border:"none",cursor:"pointer",
    padding:"9px 14px",fontSize:13,fontWeight:700,fontFamily:"sans-serif",
    letterSpacing:1,whiteSpace:"nowrap",borderRadius:7,transition:".15s"
  });

  return(
    <div style={{...BASE_BG,minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      <Notif n={notification}/>

      {/* Header */}
      <header>
        <div style={{background:"linear-gradient(135deg,#004d22,#009c3b 25%,#002776 60%,#001240)"}}>
          <div style={{background:"rgba(0,0,0,.55)",padding:"12px 16px",
            display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:26,letterSpacing:5}}>⚽ PAINEL DO ADMINISTRADOR</div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#ffdf00",letterSpacing:2}}>{adminData.nome}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              {/* Badge do plano atual */}
              <div style={{background:planoInfo.corBg,border:`1px solid ${planoInfo.cor}`,
                borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16}}>{planoInfo.icon}</span>
                <span style={{fontFamily:"sans-serif",fontSize:12,color:planoInfo.cor,fontWeight:700}}>
                  {planoInfo.nome}
                </span>
              </div>
              <a href={'/'+adminSlug} target="_blank" rel="noopener noreferrer"
                style={{background:"rgba(0,156,59,.3)",color:"#009c3b",border:"1px solid rgba(0,156,59,.4)",
                  borderRadius:6,padding:"6px 12px",fontSize:12,fontFamily:"sans-serif",textDecoration:"none",fontWeight:700}}>
                🔗 Ver minha página
              </a>
              <button onClick={()=>{setCurrentAdmin(null);window.location.href="/";}}
                style={{background:"#cc0000",border:"none",color:"#fff",borderRadius:6,
                  padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>
                Sair
              </button>
            </div>
          </div>
        </div>
        <BrStripe/>
      </header>

      {/* Seletor de bolão + abas */}
      <div style={{background:"rgba(0,0,0,.85)",borderBottom:"1px solid #1a2a1a",padding:"10px 14px"}}>
        {/* Seletor */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <span style={{fontFamily:"sans-serif",fontSize:12,color:"#888"}}>MEU BOLÃO:</span>
          {Object.entries(boloes).map(([bid,b])=>(
            <button key={bid} onClick={()=>setSelectedBid(bid)}
              style={{background:selectedBid===bid?"rgba(255,223,0,.15)":"rgba(255,255,255,.06)",
                border:`2px solid ${selectedBid===bid?"#ffdf00":"#2a2a2a"}`,
                color:selectedBid===bid?"#ffdf00":"#aaa",borderRadius:8,
                padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"sans-serif"}}>
              ⚽ {b.nome}
            </button>
          ))}
          {numBoloes < maxBoloes && (
            <button onClick={()=>setAba("boloes")}
              style={{background:"rgba(0,156,59,.2)",border:"1px solid rgba(0,156,59,.4)",
                color:"#009c3b",borderRadius:8,padding:"6px 14px",cursor:"pointer",
                fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>
              + Novo Bolão
            </button>
          )}
        </div>
        {/* Abas */}
        <div style={{display:"flex",gap:6,overflowX:"auto",flexWrap:"nowrap"}}>
          {[
            {id:"boloes",      label:"🏆 Bolões"},
            {id:"participantes",label:"👥 Participantes"},
            {id:"resultados",  label:"⚽ Resultados"},
            {id:"ranking",     label:"📊 Ranking"},
            {id:"regras",      label:"📋 Regras"},
            {id:"premio",      label:"🎁 Prêmio"},
            {id:"avisos",      label:"📢 Avisos"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setAba(t.id)} style={tabStyle(t.id)}>{t.label}</button>
          ))}
          {/* Botão Upgrade - scroll até rodapé */}
          <button onClick={()=>document.getElementById("upgrade-footer")?.scrollIntoView({behavior:"smooth"})}
            style={{
              background:"linear-gradient(135deg,rgba(200,162,0,.25),rgba(139,112,0,.25))",
              color:"#ffdf00",border:"2px solid #c8a200",cursor:"pointer",
              padding:"9px 14px",fontSize:13,fontWeight:900,fontFamily:"sans-serif",
              letterSpacing:1,whiteSpace:"nowrap",borderRadius:7,transition:".15s",
              animation:"upgradePulse 2s ease-in-out infinite",
            }}>
            ⭐ UPGRADE
          </button>
        </div>
      </div>


      <main style={{maxWidth:760,margin:"0 auto",padding:"16px 12px"}}>

        {/* ── BOLÕES ── */}
        {aba==="boloes"&&(
          <div>
            {/* Banner de upgrade para plano grátis */}
            {plano==="gratis"&&(
              <div style={{background:"linear-gradient(135deg,rgba(200,162,0,.15),rgba(0,156,59,.15))",
                border:"2px solid #c8a200",borderRadius:14,padding:"16px 18px",marginBottom:16}}>
                <div style={{fontSize:15,letterSpacing:2,color:"#ffdf00",marginBottom:8}}>
                  ⭐ FAÇA UPGRADE E TENHA MAIS PODER!
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div style={{background:"rgba(0,156,59,.15)",border:"2px solid #009c3b",borderRadius:10,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:22}}>⚡</div>
                    <div style={{fontSize:14,letterSpacing:2,color:"#009c3b",marginTop:4}}>BOLÃO PRO</div>
                    <div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa",marginTop:4,lineHeight:1.6}}>
                      1 bolão<br/>até 50 participantes
                    </div>
                  </div>
                  <div style={{background:"rgba(200,162,0,.15)",border:"2px solid #c8a200",borderRadius:10,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:22}}>👑</div>
                    <div style={{fontSize:14,letterSpacing:2,color:"#c8a200",marginTop:4}}>BOLÃO PREMIUM</div>
                    <div style={{fontFamily:"sans-serif",fontSize:11,color:"#aaa",marginTop:4,lineHeight:1.6}}>
                      3 bolões<br/>até 50 pessoas cada
                    </div>
                  </div>
                </div>
                <a href="https://wa.me/5511999999999?text=Olá+Prof.+Isaac!+Quero+fazer+upgrade+do+meu+Bolão"
                  target="_blank"
                  style={{display:"block",width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",
                    color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:15,letterSpacing:2,
                    cursor:"pointer",textAlign:"center",textDecoration:"none",fontFamily:"'Bebas Neue',sans-serif",
                    boxSizing:"border-box"}}>
                  📲 FALAR COM O PROF. ISAAC PARA FAZER UPGRADE
                </a>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#777",textAlign:"center",marginTop:6}}>
                  Plano atual: 🆓 Grátis · {numBoloes}/{maxBoloes} bolões · {aprovados.length}/{maxMembros} pessoas no bolão atual
                </div>
              </div>
            )}

            {/* Banner upgrade para Pro → Premium */}
            {plano==="pro"&&(
              <div style={{background:"rgba(200,162,0,.1)",border:"1px solid rgba(200,162,0,.4)",
                borderRadius:12,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,letterSpacing:2,color:"#c8a200"}}>👑 UPGRADE PARA PREMIUM</div>
                  <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginTop:2}}>
                    Crie até 3 bolões com 50 pessoas cada!
                  </div>
                </div>
                <a href="https://wa.me/5511999999999?text=Olá+Prof.+Isaac!+Quero+upgrade+para+Premium"
                  target="_blank"
                  style={{background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",
                    padding:"8px 16px",borderRadius:8,textDecoration:"none",fontSize:13,
                    fontFamily:"sans-serif",fontWeight:700}}>
                  📲 Fazer Upgrade
                </a>
              </div>
            )}
            {numBoloes < maxBoloes && (
              <Card color="rgba(0,156,59,.3)">
                <div style={{fontSize:16,letterSpacing:3,color:"#009c3b",marginBottom:12}}>➕ CRIAR NOVO BOLÃO</div>
                <div style={{display:"grid",gap:8,marginBottom:10}}>
                  <div><Label>NOME DO BOLÃO *</Label><AdminInput value={newBNome} onChange={e=>setNewBNome(e.target.value)} placeholder="Ex: Bolão da Família 2026"/></div>
                  <div><Label>DESCRIÇÃO</Label><AdminInput value={newBDesc} onChange={e=>setNewBDesc(e.target.value)} placeholder="Ex: Copa do Mundo 2026"/></div>
                </div>
                <button onClick={criarBolao}
                  style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"11px",cursor:"pointer",fontSize:15,fontWeight:700,letterSpacing:2}}>
                  CRIAR BOLÃO ▶
                </button>
              </Card>
            )}
            {numBoloes >= maxBoloes && (
              <div style={{background:"rgba(255,223,0,.08)",border:"1px solid rgba(255,223,0,.3)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontFamily:"sans-serif",fontSize:13,color:"#ffdf00"}}>
                ⚠️ Limite de {maxBoloes} bolões atingido para sua licença.
              </div>
            )}
            {Object.entries(boloes).map(([bid,b])=>(
              <Card key={bid} color={selectedBid===bid?"#ffdf00":"#1a2a1a"}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:20,letterSpacing:3,color:selectedBid===bid?"#ffdf00":"#fff"}}>{b.nome}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginTop:2}}>
                      {b.descricao} · ✅ {Object.values(members[bid]||{}).filter(m=>m.status==="aprovado").length}/{maxMembros} participantes
                    </div>
                    <div style={{fontFamily:"sans-serif",fontSize:11,color:"#009c3b",marginTop:2}}>
                      🔗 Link: <strong>{window.location.origin}/{adminSlug}</strong>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{
                      const n=window.prompt("Novo nome:",b.nome);
                      if(n?.trim()) update(dbRef(db,`boloes/${bid}`),{nome:n.trim()}).then(()=>notify("✅ Renomeado!"));
                    }} style={{background:"rgba(255,223,0,.15)",color:"#ffdf00",border:"1px solid rgba(255,223,0,.3)",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>✏️ Renomear</button>
                    <button onClick={()=>{
                      if(window.confirm(`Excluir "${b.nome}"?`))
                        remove(dbRef(db,`boloes/${bid}`)).then(()=>notify("🗑️ Excluído."));
                    }} style={{background:"rgba(120,16,16,.3)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>🗑️ Excluir</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── PARTICIPANTES ── */}
        {aba==="participantes"&&(
          <div>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:12}}>
              ✅ {aprovados.length}/{maxMembros} participantes no bolão <strong style={{color:"#fff"}}>{bolaoAtual.nome}</strong>
            </div>
            {aprovados.map(m=>(
              <div key={m.uid} style={{background:"rgba(0,156,59,.06)",border:"1px solid rgba(0,156,59,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                {editM?.uid===m.uid?(
                  <div style={{display:"grid",gap:8}}>
                    {[{l:"Nome",k:"nome"},{l:"Apelido",k:"apelido"},{l:"WhatsApp",k:"whatsapp"},{l:"Email",k:"email"}].map(f=>(
                      <div key={f.k}>
                        <Label>{f.l.toUpperCase()}</Label>
                        <AdminInput value={editM[f.k]||""} onChange={e=>setEditM(p=>({...p,[f.k]:e.target.value}))}/>
                      </div>
                    ))}
                    {/* Avatar */}
                    <div>
                      <Label>AVATAR</Label>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",background:"#050d0a",borderRadius:8,padding:"8px",border:"1px solid #009c3b"}}>
                        {AVATARES.map(av=>(
                          <button key={av} onClick={()=>setEditM(p=>({...p,avatar:av}))}
                            style={{background:editM.avatar===av?"rgba(0,156,59,.4)":"transparent",
                              border:`2px solid ${editM.avatar===av?"#009c3b":"transparent"}`,
                              borderRadius:6,padding:"3px",cursor:"pointer",fontSize:22,lineHeight:1}}>
                            {av}
                          </button>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}}>
                        {AVATAR_COLORS.map((c,i)=>(
                          <button key={c} onClick={()=>setEditM(p=>({...p,avatarColor:i}))}
                            style={{width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${editM.avatarColor===i?"#fff":"transparent"}`,cursor:"pointer"}}/>
                        ))}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,fontFamily:"sans-serif",fontSize:12,color:"#888"}}>
                        Preview: <MemberAvatar member={editM} size={36}/> <span style={{color:"#fff"}}>{editM.apelido}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{ update(dbRef(db,`members/${selectedBid}/${m.uid}`),editM).then(()=>{setEditM(null);notify("✅ Salvo!");}); }}
                        style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontSize:14,fontWeight:700}}>💾 Salvar</button>
                      <button onClick={()=>setEditM(null)}
                        style={{background:"#333",color:"#aaa",border:"none",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:"sans-serif"}}>Cancelar</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <MemberAvatar member={m} size={40}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:16,letterSpacing:1}}>{m.apelido}</div>
                      <div style={{fontFamily:"sans-serif",fontSize:11,color:"#777"}}>👤 {m.nome}{m.whatsapp&&<> · 📱 {m.whatsapp}</>}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setEditGuessUid(editGuessUid===m.uid?null:m.uid)}
                        style={{background:editGuessUid===m.uid?"rgba(0,156,59,.4)":"rgba(0,156,59,.15)",color:"#00ff7f",border:"1px solid rgba(0,156,59,.4)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>🎯</button>
                      <button onClick={()=>setEditM({...m})}
                        style={{background:"rgba(255,223,0,.15)",color:"#ffdf00",border:"1px solid rgba(255,223,0,.3)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>✏️</button>
                      <button onClick={()=>{if(window.confirm(`Remover ${m.apelido}?`)) remove(dbRef(db,`members/${selectedBid}/${m.uid}`)).then(()=>notify("Removido."));}}
                        style={{background:"rgba(120,16,16,.3)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12}}>🗑️</button>
                    </div>
                  </div>
                )}

                {/* PAINEL DE PALPITES MANUAIS (admin) */}
                {editGuessUid===m.uid&&(
                  <div style={{marginTop:10,background:"#050d0a",border:"1px solid rgba(0,156,59,.3)",
                    borderRadius:8,padding:"12px",maxHeight:380,overflowY:"auto"}}>
                    <div style={{fontFamily:"sans-serif",fontSize:12,color:"#00ff7f",
                      letterSpacing:1,marginBottom:10}}>
                      🎯 PALPITES DE {m.apelido?.toUpperCase()}
                    </div>
                    {SCHEDULE.map(g=>{
                      const key = `${safeKey(adminSlug)}_${safeKey(selectedBid)}_${safeKey(m.uid)}`;
                      const palpiteAtual = (guesses[key]||{})[g.id] || {};
                      const jaComecou = isPast(g.date);
                      const mostrarQuemPassa = g.knockout &&
                        !isNaN(parseInt(palpiteAtual.home)) && !isNaN(parseInt(palpiteAtual.away)) &&
                        palpiteAtual.home!=="" && palpiteAtual.away!=="" &&
                        parseInt(palpiteAtual.home)===parseInt(palpiteAtual.away);
                      return (
                        <div key={g.id} style={{borderBottom:"1px solid #1a2a1a",paddingBottom:4,marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",padding:"6px 0"}}>
                            <div style={{flex:1,minWidth:140,fontFamily:"sans-serif",fontSize:11,
                              color:jaComecou?"#666":"#ccc"}}>
                              {g.home} <span style={{color:"#444"}}>x</span> {g.away}
                              <div style={{fontSize:9,color:"#555"}}>{fmtDate(g.date)} {fmtTime(g.date)}</div>
                            </div>
                            <input type="number" min="0" placeholder="–" defaultValue={palpiteAtual.home??""}
                              onBlur={e=>adminSaveGuess(m.uid,g.id,"home",e.target.value)}
                              style={{width:38,background:"#0a1a0a",color:"#fff",border:"1px solid #2a3a2a",
                                borderRadius:5,padding:"4px",fontSize:13,textAlign:"center"}}/>
                            <span style={{color:"#555"}}>x</span>
                            <input type="number" min="0" placeholder="–" defaultValue={palpiteAtual.away??""}
                              onBlur={e=>adminSaveGuess(m.uid,g.id,"away",e.target.value)}
                              style={{width:38,background:"#0a1a0a",color:"#fff",border:"1px solid #2a3a2a",
                                borderRadius:5,padding:"4px",fontSize:13,textAlign:"center"}}/>
                          </div>
                          {mostrarQuemPassa && (
                            <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:4,flexWrap:"wrap",marginBottom:4}}>
                              <span style={{fontFamily:"sans-serif",fontSize:10,color:"#ffdf00"}}>🤔 Quem passa?</span>
                              <button onClick={()=>adminSaveGuess(m.uid,g.id,"quemPassa","home")}
                                style={{background:palpiteAtual.quemPassa==="home"?"#009c3b":"rgba(255,255,255,.08)",
                                  color:"#fff",border:`1px solid ${palpiteAtual.quemPassa==="home"?"#00ff7f":"#333"}`,
                                  borderRadius:6,padding:"3px 8px",cursor:"pointer",
                                  fontFamily:"sans-serif",fontSize:10,fontWeight:700}}>
                                {g.home}
                              </button>
                              <button onClick={()=>adminSaveGuess(m.uid,g.id,"quemPassa","away")}
                                style={{background:palpiteAtual.quemPassa==="away"?"#009c3b":"rgba(255,255,255,.08)",
                                  color:"#fff",border:`1px solid ${palpiteAtual.quemPassa==="away"?"#00ff7f":"#333"}`,
                                  borderRadius:6,padding:"3px 8px",cursor:"pointer",
                                  fontFamily:"sans-serif",fontSize:10,fontWeight:700}}>
                                {g.away}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={()=>setEditGuessUid(null)}
                      style={{width:"100%",marginTop:10,background:"#1a3a1a",color:"#00ff7f",
                        border:"1px solid #009c3b",borderRadius:6,padding:"8px",cursor:"pointer",
                        fontFamily:"sans-serif",fontSize:12,fontWeight:700}}>
                      ✅ Concluir edição
                    </button>
                  </div>
                )}
              </div>
            ))}

            {aprovados.length < maxMembros && (
              <Card color="rgba(0,156,59,.2)">
                <div style={{fontSize:14,letterSpacing:3,color:"#009c3b",marginBottom:10}}>➕ ADICIONAR PARTICIPANTE</div>
                <div style={{marginBottom:8}}>
                  <Label>BOLÃO *</Label>
                  <select value={selectedBid} onChange={e=>setSelectedBid(e.target.value)}
                    style={{width:"100%",background:"#050d0a",color:"#ffdf00",border:"1px solid #009c3b",
                      borderRadius:8,padding:"10px 12px",fontSize:14,cursor:"pointer"}}>
                    {Object.entries(boloes).map(([bid,b])=><option key={bid} value={bid}>{b.nome}</option>)}
                  </select>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  {[{ph:"Nome completo *",val:newNome,set:setNewNome},{ph:"Apelido *",val:newApe,set:setNewApe},
                    {ph:"WhatsApp",val:newWa,set:setNewWa},{ph:"Email",val:newEmail,set:setNewEmail}].map(f=>(
                    <input key={f.ph} type="text" placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}
                      style={{background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:"sans-serif"}}/>
                  ))}
                </div>
                <div style={{marginBottom:8}}>
                  <Label>SENHA DO PARTICIPANTE * <span style={{color:"#555",fontWeight:400}}>(para ele entrar no bolão)</span></Label>
                  <input type="text" placeholder="Ex: 1234 ou nome do participante" value={newSenha||""} onChange={e=>setNewSenha(e.target.value)}
                    style={{width:"100%",background:"#050d0a",color:"#ffdf00",border:"1px solid #009c3b",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"sans-serif"}}/>
                </div>
                <div style={{marginBottom:10}}>
                  <Label>PONTOS EXTRAS (opcional)</Label>
                  <input type="number" min="0" max="999" placeholder="0" value={newPontosExtras||""} onChange={e=>setNewPontosExtras(parseInt(e.target.value)||0)}
                    style={{width:100,background:"#050d0a",color:"#c8a200",border:"1px solid #c8a200",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"monospace",textAlign:"center"}}/>
                  <span style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginLeft:8}}>pontos de bônus iniciais</span>
                </div>
                <button onClick={addMembro}
                  style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontSize:14,fontWeight:700}}>
                  ➕ Adicionar Participante
                </button>
              </Card>
            )}
          </div>
        )}

        {/* ── RESULTADOS ── */}
        {aba==="resultados"&&(
          <div>
            <Card color="rgba(0,156,59,.3)">
              <div style={{fontSize:14,letterSpacing:3,color:"#009c3b",marginBottom:8}}>🌐 ATUALIZAÇÃO AUTOMÁTICA</div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#aaa",marginBottom:10,lineHeight:1.7}}>
                Cadastre-se grátis em <strong style={{color:"#fff"}}>football-data.org</strong> e cole sua chave:
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                <input type="text" placeholder="Chave de API" value={apiKey}
                  onChange={e=>{setApiKey(e.target.value);localStorage.setItem("bg26_apikey",e.target.value);}}
                  style={{flex:1,minWidth:160,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:8,padding:"9px 12px",fontSize:13,fontFamily:"monospace"}}/>
                <button onClick={fetchResultados} disabled={fetching}
                  style={{background:fetching?"#1a1a1a":"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>
                  {fetching?"⏳":"🔄"} Atualizar
                </button>
              </div>
              {lastUp&&<div style={{fontFamily:"sans-serif",fontSize:11,color:"#666"}}>🕐 {lastUp}</div>}
            </Card>

            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              <button onClick={()=>setFilterGrp(filterGrp==="Hoje"?"Todos":"Hoje")}
                style={{background:filterGrp==="Hoje"?"#cc0000":"rgba(204,0,0,.15)",
                  color:"#fff",border:"1px solid #cc0000",borderRadius:20,padding:"7px 14px",
                  fontSize:13,fontWeight:700,fontFamily:"sans-serif",cursor:"pointer",
                  display:"flex",alignItems:"center",gap:6}}>
                🔴 Jogos de Hoje
              </button>
              <select value={filterGrp} onChange={e=>setFilterGrp(e.target.value)}
                style={{background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:6,padding:"7px 10px",fontSize:13,fontFamily:"sans-serif",cursor:"pointer"}}>
                {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
              </select>
              <button onClick={reprocessarChaveamento}
                style={{background:"rgba(100,0,200,.25)",color:"#cc88ff",border:"1px solid #8844cc",
                  borderRadius:20,padding:"7px 14px",fontSize:13,fontWeight:700,
                  fontFamily:"sans-serif",cursor:"pointer"}}>
                🔄 Corrigir Bandeiras
              </button>
            </div>

            {filteredGames().length===0&&filterGrp==="Hoje"&&(
              <div style={{textAlign:"center",padding:"24px",fontFamily:"sans-serif",color:"#666",fontSize:13}}>
                📅 Nenhum jogo hoje. Clique no botão novamente para ver todos.
              </div>
            )}

            {filteredGames().map(g=>{
              const r=results[g.id]||{};
              const hasR=r.home!==undefined&&r.home!=="";
              const ovr = g.id>=101 ? (scheduleOverrides[g.id]||{}) : {};
              const gHome = (ovr.home && ovr.home.trim()) ? ovr.home : g.home;
              const gAway = (ovr.away && ovr.away.trim()) ? ovr.away : g.away;
              return(
                <div key={g.id} style={{background:hasR?"rgba(0,156,59,.07)":"rgba(255,255,255,.02)",
                  border:`1px solid ${hasR?"#009c3b":"#1a2a1a"}`,borderRadius:12,overflow:"hidden",marginBottom:8}}>
                  <div style={{background:"rgba(255,255,255,.05)",borderBottom:`1px solid ${hasR?"#009c3b":"#1a2a1a"}`,
                    padding:"7px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                    <div style={{fontFamily:"sans-serif",fontSize:12,display:"flex",gap:10}}>
                      <span style={{color:"#ffdf00",fontWeight:700}}>{fmtDate(g.date)}</span>
                      <span style={{fontWeight:700}}>{fmtTime(g.date)} BRT</span>
                      <span style={{color:"#666"}}>📍{g.city}</span>
                    </div>
                    <span style={{fontFamily:"sans-serif",fontSize:10,background:"#002776",color:"#aaa",padding:"2px 8px",borderRadius:20}}>
                      {g.knockout?g.group:`GR.${g.group}`}
                    </span>
                  </div>
                  <div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
                    <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:14,fontWeight:700}}>{gHome}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" min="0" max="20" value={r.home??""} placeholder="–"
                        onChange={e=>saveResultLocal(g.id,"home",e.target.value)}
                        style={{width:48,height:48,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:8,fontSize:22,fontFamily:"monospace"}}/>
                      <span style={{color:"#fff",fontSize:20,fontWeight:900}}>×</span>
                      <input type="number" min="0" max="20" value={r.away??""} placeholder="–"
                        onChange={e=>saveResultLocal(g.id,"away",e.target.value)}
                        style={{width:48,height:48,textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:8,fontSize:22,fontFamily:"monospace"}}/>
                    </div>
                    <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:14,fontWeight:700}}>{gAway}</div>
                  </div>
                  {/* Empate em jogo mata-mata: admin define quem passou (pênaltis/prorrogação) */}
                  {g.knockout && r?.home!==undefined && r?.home!=="" &&
                    r?.away!==undefined && r?.away!=="" && Number(r.home)===Number(r.away) && (
                    <div style={{padding:"0 14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      <div style={{background:"rgba(255,223,0,.08)",border:"1px solid rgba(255,223,0,.3)",
                        borderRadius:10,padding:"8px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,width:"100%"}}>
                        <div style={{fontFamily:"sans-serif",fontSize:11,color:"#ffdf00",letterSpacing:1}}>
                          ⚖️ Empate — quem passou (pênaltis/prorrogação)?
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>saveResultLocal(g.id,"quemPassa","home")}
                            style={{background:r?.quemPassa==="home"?"#009c3b":"rgba(255,255,255,.08)",
                              color:"#fff",border:`1px solid ${r?.quemPassa==="home"?"#00ff7f":"#333"}`,
                              borderRadius:8,padding:"6px 14px",cursor:"pointer",
                              fontFamily:"sans-serif",fontSize:12,fontWeight:700}}>
                            {gHome}
                          </button>
                          <button onClick={()=>saveResultLocal(g.id,"quemPassa","away")}
                            style={{background:r?.quemPassa==="away"?"#009c3b":"rgba(255,255,255,.08)",
                              color:"#fff",border:`1px solid ${r?.quemPassa==="away"?"#00ff7f":"#333"}`,
                              borderRadius:8,padding:"6px 14px",cursor:"pointer",
                              fontFamily:"sans-serif",fontSize:12,fontWeight:700}}>
                            {gAway}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── RANKING ── */}
        {aba==="ranking"&&(
          <div>
            <div style={{fontSize:20,letterSpacing:4,color:"#ffdf00",marginBottom:14}}>🏆 RANKING — {bolaoAtual.nome}</div>
            {getRanking().map((p,i)=>(
              <div key={p.uid} style={{
                background:i===0?"linear-gradient(90deg,rgba(255,215,0,.18),transparent)":i===1?"linear-gradient(90deg,rgba(192,192,192,.1),transparent)":i===2?"linear-gradient(90deg,rgba(205,127,50,.1),transparent)":"rgba(255,255,255,.03)",
                border:`1px solid ${i===0?"rgba(255,215,0,.4)":"#1a1a1a"}`,borderRadius:12,padding:"14px 16px",
                display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{fontSize:24,width:36,textAlign:"center"}}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{fontFamily:"sans-serif",fontWeight:900,color:"#666",fontSize:16}}>{i+1}°</span>}
                </div>
                <MemberAvatar member={p} size={36}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:17,letterSpacing:2}}>{p.apelido}</div>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#666"}}>🎯 {p.exact} exatos · ✅ {p.win} acertos</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:28,color:i===0?"#ffdf00":"#fff",fontWeight:900,lineHeight:1}}>{p.pts}</div>
                  <div style={{fontFamily:"sans-serif",fontSize:10,color:"#555"}}>PTS</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REGRAS ── */}
        {aba==="regras"&&(
          <div>
            <Card color="rgba(255,223,0,.2)">
              <div style={{fontSize:16,letterSpacing:3,color:"#ffdf00",marginBottom:14}}>📋 REGRAS DO BOLÃO</div>
              <div style={{display:"grid",gap:12,marginBottom:14}}>
                <div>
                  <Label>PONTOS POR PLACAR EXATO 🎯</Label>
                  <input type="number" min="1" max="10" value={regras.placarExato||3}
                    onChange={e=>setRegras(r=>({...r,placarExato:parseInt(e.target.value)||3}))}
                    style={{width:80,background:"#050d0a",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:8,padding:"8px",fontSize:18,fontFamily:"monospace",textAlign:"center"}}/>
                  <span style={{fontFamily:"sans-serif",fontSize:13,color:"#888",marginLeft:8}}>pontos</span>
                </div>
                <div>
                  <Label>PONTOS POR ACERTAR O VENCEDOR ✅</Label>
                  <input type="number" min="0" max="5" value={regras.acertouVencedor||1}
                    onChange={e=>setRegras(r=>({...r,acertouVencedor:parseInt(e.target.value)||1}))}
                    style={{width:80,background:"#050d0a",color:"#c8a200",border:"2px solid #c8a200",borderRadius:8,padding:"8px",fontSize:18,fontFamily:"monospace",textAlign:"center"}}/>
                  <span style={{fontFamily:"sans-serif",fontSize:13,color:"#888",marginLeft:8}}>pontos</span>
                </div>
                <div>
                  <Label>OBSERVAÇÕES ADICIONAIS</Label>
                  <textarea value={regras.obs||""} onChange={e=>setRegras(r=>({...r,obs:e.target.value}))}
                    placeholder="Ex: Em caso de empate no ranking, critério de desempate será..."
                    rows={3} style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"sans-serif",resize:"vertical"}}/>
                </div>
              </div>
              <button onClick={salvarRegras}
                style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",border:"none",borderRadius:8,padding:"11px",cursor:"pointer",fontSize:15,fontWeight:700,letterSpacing:2}}>
                💾 SALVAR REGRAS
              </button>

              {/* Preview das regras */}
              <div style={{marginTop:14,background:"rgba(255,255,255,.04)",borderRadius:10,padding:"12px"}}>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:8}}>COMO FICARÁ PARA OS PARTICIPANTES:</div>
                {[
                  {icon:"🎯",pts:regras.placarExato||3,desc:"Acertou o placar exato"},
                  {icon:"✅",pts:regras.acertouVencedor||1,desc:"Acertou quem vence (mas errou o placar)"},
                  {icon:"❌",pts:0,desc:"Errou quem vence"},
                ].map(r=>(
                  <div key={r.desc} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,fontFamily:"sans-serif",fontSize:13}}>
                    <span style={{fontSize:18}}>{r.icon}</span>
                    <span style={{color:"#ffdf00",fontWeight:700,minWidth:50}}>{r.pts} pts</span>
                    <span style={{color:"#aaa"}}>{r.desc}</span>
                  </div>
                ))}
                {regras.obs&&<div style={{fontFamily:"sans-serif",fontSize:12,color:"#777",marginTop:8,borderTop:"1px solid #1a1a1a",paddingTop:8}}>{regras.obs}</div>}
              </div>
            </Card>
          </div>
        )}

        {/* ── PRÊMIO ── */}
        {aba==="premio"&&(
          <div>
            <Card color="rgba(200,162,0,.3)">
              <div style={{fontSize:16,letterSpacing:3,color:"#c8a200",marginBottom:12}}>🎁 PRÊMIO DO BOLÃO</div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:10,lineHeight:1.7}}>
                Descreva o prêmio do bolão. Será exibido para todos os participantes.
              </div>
              <textarea value={premio} onChange={e=>setPremio(e.target.value)}
                placeholder="Ex: 1º lugar: R$ 200,00 em Pix&#10;2º lugar: R$ 100,00 em Pix&#10;3º lugar: R$ 50,00 em Pix"
                rows={6} style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #c8a200",borderRadius:8,padding:"12px",fontSize:14,fontFamily:"sans-serif",resize:"vertical",marginBottom:10}}/>
              <button onClick={salvarPremio}
                style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",border:"none",borderRadius:8,padding:"11px",cursor:"pointer",fontSize:15,fontWeight:700,letterSpacing:2}}>
                💾 SALVAR PRÊMIO
              </button>
              {premio&&(
                <div style={{marginTop:12,background:"rgba(200,162,0,.08)",borderRadius:10,padding:"12px",border:"1px solid rgba(200,162,0,.2)"}}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#c8a200",letterSpacing:1,marginBottom:6}}>🎁 PREVIEW:</div>
                  <div style={{fontFamily:"sans-serif",fontSize:14,color:"#fff",whiteSpace:"pre-wrap",lineHeight:1.8}}>{premio}</div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── AVISOS ── */}
        {aba==="avisos"&&(
          <div>
            <Card color="rgba(0,85,180,.3)">
              <div style={{fontSize:16,letterSpacing:3,color:"#55aaff",marginBottom:10}}>📢 ENVIAR AVISO</div>
              <textarea value={aviso} onChange={e=>setAviso(e.target.value)}
                placeholder="Digite o aviso para todos os participantes..."
                rows={3} style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a3a5a",borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"sans-serif",resize:"vertical",marginBottom:10}}/>
              <button onClick={enviarAviso}
                style={{width:"100%",background:"linear-gradient(135deg,#003580,#0055c8)",color:"#fff",border:"none",borderRadius:8,padding:"11px",cursor:"pointer",fontSize:15,fontWeight:700,letterSpacing:2}}>
                📢 ENVIAR PARA TODOS
              </button>
            </Card>

            {avisos.length>0&&(
              <div>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",letterSpacing:1,marginBottom:10}}>AVISOS ENVIADOS:</div>
                {avisos.map(a=>(
                  <div key={a.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid #1a2a3a",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"sans-serif",fontSize:14,color:"#ddd",lineHeight:1.6}}>{a.texto}</div>
                      <div style={{fontFamily:"sans-serif",fontSize:10,color:"#555",marginTop:4}}>📅 {a.data}</div>
                    </div>
                    <button onClick={()=>remove(dbRef(db,`avisos/${selectedBid}/${a.id}`)).then(()=>notify("Aviso removido."))}
                      style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontSize:18,flexShrink:0}}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
            {avisos.length===0&&(
              <div style={{textAlign:"center",padding:"30px",fontFamily:"sans-serif",color:"#555"}}>Nenhum aviso enviado ainda.</div>
            )}
          </div>
        )}

      </main>

      {/* ── SEÇÃO UPGRADE RODAPÉ ── */}
      <div id="upgrade-footer" style={{background:"linear-gradient(135deg,#0a150a,#0a0a15)",
        borderTop:"2px solid rgba(200,162,0,.3)",padding:"32px 16px"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:22,letterSpacing:4,color:"#ffdf00",fontFamily:"'Bebas Neue',sans-serif"}}>
              ⭐ FAÇA UPGRADE DO SEU PLANO
            </div>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#666",marginTop:6}}>
              Plano atual: <strong style={{color:planoInfo.cor}}>{planoInfo.icon} {planoInfo.nome}</strong>
              {" · "}Contrate diretamente com o Prof. Isaac Martins
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>

            {/* PRO */}
            <div style={{background:"rgba(0,156,59,.1)",
              border:`2px solid ${plano==="pro" ? "#009c3b" : "rgba(0,156,59,.35)"}`,
              borderRadius:16,padding:"22px 18px",textAlign:"center",position:"relative",
              boxShadow:plano==="pro"?"0 0 24px rgba(0,156,59,.25)":"none"}}>
              {plano==="pro"&&(
                <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",
                  background:"#009c3b",color:"#fff",fontSize:10,fontWeight:900,
                  padding:"3px 14px",borderRadius:100,letterSpacing:1,whiteSpace:"nowrap"}}>
                  ✓ SEU PLANO ATUAL
                </div>
              )}
              <div style={{fontSize:40,marginBottom:8}}>⚡</div>
              <div style={{fontSize:20,letterSpacing:3,color:"#009c3b",marginBottom:12,
                fontFamily:"'Bebas Neue',sans-serif"}}>BOLÃO PRO</div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#bbb",
                lineHeight:2.2,marginBottom:16,textAlign:"left"}}>
                ✅ &nbsp;1 bolão<br/>
                ✅ &nbsp;Até 50 participantes<br/>
                ✅ &nbsp;Resultados em tempo real<br/>
                ✅ &nbsp;Ranking automático<br/>
                ✅ &nbsp;Link exclusivo
              </div>
              <a href={`https://wa.me/5511999999999?text=Olá+Prof.+Isaac!+Quero+o+BOLÃO+PRO.+Meu+link:+bolao-do-gestor.vercel.app/${adminSlug}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:"block",background:"linear-gradient(135deg,#009c3b,#006622)",
                  color:"#fff",borderRadius:10,padding:"13px",textDecoration:"none",
                  fontFamily:"sans-serif",fontSize:14,fontWeight:700,letterSpacing:1,
                  boxShadow:"0 4px 16px rgba(0,156,59,.4)"}}>
                📲 QUERO O PRO
              </a>
            </div>

            {/* PREMIUM */}
            <div style={{background:"rgba(200,162,0,.1)",
              border:`2px solid ${plano==="premium" ? "#c8a200" : "rgba(200,162,0,.35)"}`,
              borderRadius:16,padding:"22px 18px",textAlign:"center",position:"relative",
              boxShadow:plano==="premium"?"0 0 24px rgba(200,162,0,.25)":"none"}}>
              {plano==="premium"&&(
                <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",
                  background:"#c8a200",color:"#000",fontSize:10,fontWeight:900,
                  padding:"3px 14px",borderRadius:100,letterSpacing:1,whiteSpace:"nowrap"}}>
                  ✓ SEU PLANO ATUAL
                </div>
              )}
              <div style={{fontSize:40,marginBottom:8}}>👑</div>
              <div style={{fontSize:20,letterSpacing:3,color:"#c8a200",marginBottom:12,
                fontFamily:"'Bebas Neue',sans-serif"}}>BOLÃO PREMIUM</div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#bbb",
                lineHeight:2.2,marginBottom:16,textAlign:"left"}}>
                ✅ &nbsp;Até 3 bolões<br/>
                ✅ &nbsp;Até 50 participantes cada<br/>
                ✅ &nbsp;Resultados em tempo real<br/>
                ✅ &nbsp;Ranking automático<br/>
                ✅ &nbsp;Links exclusivos por bolão
              </div>
              <a href={`https://wa.me/5511999999999?text=Olá+Prof.+Isaac!+Quero+o+BOLÃO+PREMIUM.+Meu+link:+bolao-do-gestor.vercel.app/${adminSlug}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:"block",background:"linear-gradient(135deg,#c8a200,#8b7000)",
                  color:"#fff",borderRadius:10,padding:"13px",textDecoration:"none",
                  fontFamily:"sans-serif",fontSize:14,fontWeight:700,letterSpacing:1,
                  boxShadow:"0 4px 16px rgba(200,162,0,.4)"}}>
                📲 QUERO O PREMIUM
              </a>
            </div>

          </div>

          <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:11,color:"#555",lineHeight:1.8}}>
            Entre em contato via WhatsApp com o Prof. Isaac Martins · Após o pagamento você recebe um código de licença para ativar no painel.
          </div>
        </div>
      </div>

      <BrStripe/>
      <div style={{textAlign:"center",padding:"12px",fontFamily:"sans-serif",fontSize:11,color:"#1a1a1a"}}>
        ⚽ Bolão do Gestor · By Prof. Isaac Martins
      </div>
    </div>
  );
}
function BolaoScreen({db, adminData, adminSlug, currentMember, setCurrentMember,
  boloes, members, guesses, results, notify, notification}) {

  const [subScreen, setSubScreen] = useState("menu");
  const [filterGrp, setFilterGrp] = useState("Semifinal");
  const [fontSize,  setFontSize]  = useState(()=>parseInt(localStorage.getItem("bg26_fs")||"16"));
  const [darkMode,  setDarkMode]  = useState(()=>localStorage.getItem("bg26_dark")!=="false");
  const [adminPass, setAdminPass] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [scheduleOverrides, setScheduleOverrides] = useState({});
  const [liveFetching, setLiveFetching] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("bg26_apikey")||"");
  const [lastUpdate, setLastUpdate] = useState(null);

  const fs = b => Math.round(b * fontSize / 16);
  const changeFs = d => { const n=Math.min(24,Math.max(13,fontSize+d)); setFontSize(n); localStorage.setItem("bg26_fs",String(n)); };

  // Listener: overrides de times nas próximas fases (propagação automática do chaveamento)
  useEffect(()=>{
    if(!db) return;
    const r = dbRef(db,"schedule_overrides");
    onValue(r, s=>setScheduleOverrides(s.val()||{}));
    return ()=>off(r);
  },[db]);
  const toggleDark = () => { const n=!darkMode; setDarkMode(n); localStorage.setItem("bg26_dark",String(n)); };

  // Tema claro/escuro
  const THEME = darkMode ? {
    bg: "radial-gradient(ellipse at 30% 0%,#003d1a 0%,#001a0a 40%,#050d1a 70%,#000509 100%)",
    cardBg: "rgba(255,255,255,.03)", cardBorder: "#1a2e1a",
    text: "#fff", textSub: "#aaa", textMuted: "#666",
    inputBg: "#050d0a", headerBg: "rgba(0,0,0,.55)",
    navBg: "rgba(0,0,0,.92)",
  } : {
    bg: "linear-gradient(135deg,#f0f4f0 0%,#e8f0e8 50%,#f0f0f8 100%)",
    cardBg: "rgba(255,255,255,.9)", cardBorder: "#c8d8c8",
    text: "#1a2a1a", textSub: "#555", textMuted: "#999",
    inputBg: "#fff", headerBg: "rgba(0,80,30,.85)",
    navBg: "rgba(255,255,255,.95)",
  };

  const bolaoAtual = boloes[currentMember.bolaoId];
  const membrosAprovados = Object.entries(members[currentMember.bolaoId]||{})
    .filter(([,m])=>m.status==="aprovado").map(([uid,m])=>({uid,...m}));

  const getResult  = id => results[id];
  const getGuessOf = (uid, id) => {
    const key = `${safeKey(adminSlug)}_${safeKey(currentMember.bolaoId)}_${safeKey(uid)}`;
    return guesses[key]?.[id];
  };
  const myGuesses = (() => {
    const key = `${safeKey(adminSlug)}_${safeKey(currentMember.bolaoId)}_${safeKey(currentMember.uid)}`;
    return guesses[key]||{};
  })();

  async function saveGuess(gameId, side, val) {
    // Proteção: verifica se o jogo já começou (horário de Brasília UTC-3)
    const jogo = SCHEDULE.find(g=>g.id===gameId);
    if (jogo && isPast(jogo.date)) {
      notify("⛔ Palpite bloqueado — jogo já iniciou!","err");
      return;
    }
    const key = `${safeKey(adminSlug)}_${safeKey(currentMember.bolaoId)}_${safeKey(currentMember.uid)}`;
    await set(dbRef(db,`guesses/${key}/${gameId}/${side}`), val);
  }
  

  async function saveResult(gameId, side, val) {
    await set(dbRef(db,`results/${gameId}/${side}`), val);

    const g = SCHEDULE.find(x=>x.id===gameId);
    if(!g?.knockout) return;
    const bracket = BRACKET[gameId];
    if(!bracket) return;

    // Ler resultado completo do Firebase para decidir vencedor
    const r = await new Promise(res=>{
      const ref = dbRef(db,`results/${gameId}`);
      onValue(ref, s=>{ off(ref); res(s.val()||{}); }, {onlyOnce:true});
    });

    const home = r.home, away = r.away;
    const hN = parseInt(home), aN = parseInt(away);

    let winner = null, loser = null;

    if(!isNaN(hN) && !isNaN(aN) && home!=="" && away!=="") {
      if(hN > aN) {
        // Home ganhou direto
        winner = home; loser = away;
      } else if(aN > hN) {
        // Away ganhou direto
        winner = away; loser = home;
      } else {
        // Empate no tempo normal — esperar quemPassa
        if(side === "quemPassa") {
          winner = r.quemPassa==="home" ? home : r.quemPassa==="away" ? away : null;
          loser  = r.quemPassa==="home" ? away : r.quemPassa==="away" ? home : null;
        } else {
          return; // empate mas quemPassa ainda não foi definido, aguardar
        }
      }
    }

    if(!winner || !winner.trim()) return;

    if(bracket.winSlot) {
      await set(dbRef(db,`schedule_overrides/${bracket.winSlot.id}/${bracket.winSlot.side}`), winner.trim());
    }
    if(bracket.loseSlot && loser && loser.trim()) {
      await set(dbRef(db,`schedule_overrides/${bracket.loseSlot.id}/${bracket.loseSlot.side}`), loser.trim());
    }
  }

  function getRanking() {
    return membrosAprovados.map(m=>{
      let pts=0,exact=0,win=0;
      const pe = m.pontosExtras||0;
      SCHEDULE.forEach(g=>{
        const r=getResult(g.id), gu=getGuessOf(m.uid,g.id);
        if(r&&gu){const pt=calcPoints(gu,r,g.group);if(pt!=null){pts+=pt;if(pt===3)exact++;if(pt===1)win++;}}
      });
      return {...m,pts:pts+pe,exact,win,pe};
    }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact||b.win-a.win);
  }

  // ── Classificação de grupo pelos PALPITES do usuário atual ────────────────
  function getGroupStandings(group) {
    const jogos = SCHEDULE.filter(g=>g.group===group&&!g.knockout);
    const teams = [...new Set(jogos.flatMap(g=>[g.home,g.away]))];
    const standings = teams.map(team=>({
      team, pts:0, vit:0, emp:0, der:0, gp:0, gc:0, saldo:0, jogos:0
    }));

    jogos.forEach(g=>{
      const gu = myGuesses[g.id];
      if(!gu||gu.home===undefined||gu.away===undefined) return;
      const gh=parseInt(gu.home), ga=parseInt(gu.away);
      if(isNaN(gh)||isNaN(ga)) return;

      const home = standings.find(s=>s.team===g.home);
      const away = standings.find(s=>s.team===g.away);
      if(!home||!away) return;

      home.gp+=gh; home.gc+=ga; home.saldo+=gh-ga; home.jogos++;
      away.gp+=ga; away.gc+=gh; away.saldo+=ga-gh; away.jogos++;

      if(gh>ga){home.pts+=3;home.vit++;away.der++;}
      else if(gh===ga){home.pts+=1;away.pts+=1;home.emp++;away.emp++;}
      else{away.pts+=3;away.vit++;home.der++;}
    });

    return standings
      .filter(s=>s.jogos>0)
      .sort((a,b)=>b.pts-a.pts||b.saldo-a.saldo||b.gp-a.gp||a.team.localeCompare(b.team));
  }

  // ── Confrontos 16A baseados nos palpites ──────────────────────────────────
  function get16AConfrontos() {
    // Pega 1º e 2º de cada grupo pelos palpites
    const posicoes = {};
    GROUPS.forEach(g=>{
      const st = getGroupStandings(g);
      posicoes[`1${g}`] = st[0]?.team||`1º Gr.${g}`;
      posicoes[`2${g}`] = st[1]?.team||`2º Gr.${g}`;
    });

    // Confrontos da fase 16A da FIFA 2026 (48 países, 12 grupos A-L)
    return [
      {id:1, home:posicoes["2A"]||"2A", away:posicoes["2B"]||"2B"},
      {id:2, home:posicoes["1E"]||"1E", away:"3º (A/B/C)"},
      {id:3, home:posicoes["1F"]||"1F", away:posicoes["2C"]||"2C"},
      {id:4, home:posicoes["1C"]||"1C", away:posicoes["2F"]||"2F"},
      {id:5, home:posicoes["1I"]||"1I", away:"3º (D/E/F)"},
      {id:6, home:posicoes["2E"]||"2E", away:posicoes["2I"]||"2I"},
      {id:7, home:posicoes["1A"]||"1A", away:"3º (G/H/I)"},
      {id:8, home:posicoes["1L"]||"1L", away:"3º (J/K/L)"},
      {id:9, home:posicoes["1D"]||"1D", away:"3º (B/E/F)"},
      {id:10,home:posicoes["1G"]||"1G", away:"3º (A/H/I)"},
      {id:11,home:posicoes["2K"]||"2K", away:posicoes["2L"]||"2L"},
      {id:12,home:posicoes["1H"]||"1H", away:posicoes["2J"]||"2J"},
      {id:13,home:posicoes["1B"]||"1B", away:"3º (E/F/G)"},
      {id:14,home:posicoes["1J"]||"1J", away:posicoes["2H"]||"2H"},
      {id:15,home:posicoes["1K"]||"1K", away:"3º (D/I/J)"},
      {id:16,home:posicoes["2D"]||"2D", away:posicoes["2G"]||"2G"},
    ];
  }

  const ranking = getRanking();
  const myRank  = ranking.findIndex(r=>r.uid===currentMember.uid)+1;
  const myPts   = ranking.find(r=>r.uid===currentMember.uid)?.pts||0;
  const todayGames = SCHEDULE.filter(g=>isToday(g.date));

  const FILTER_OPTS = ["Todos","Hoje",...GROUPS.map(g=>"Grupo "+g),"16 Avos","Oitavas","Quartas","Semifinal","3 Lugar","Final"];
  function filteredGames() {
    return SCHEDULE.filter(g=>{
      if(filterGrp==="Todos") return true;
      if(filterGrp==="Hoje") return isToday(g.date);
      if(filterGrp==="16 Avos") return g.group==="16avos";
      if(filterGrp==="Oitavas") return g.group==="Oitavas";
      if(filterGrp==="Quartas") return g.group==="Quartas";
      if(filterGrp==="Semifinal") return g.group==="Semifinal";
      if(filterGrp==="3 Lugar") return g.group==="3Lugar";
      if(filterGrp==="Final") return g.group==="Final";
      return "Grupo "+g.group===filterGrp;
    }).sort((a,b)=>a.date.localeCompare(b.date));
  }

  // Card de jogo
  const GameRow = ({g, mode="agenda"}) => {
    // Aplicar overrides de nome de time (ex: vencedor do jogo anterior)
    const ovr = g.id>=101 ? (scheduleOverrides[g.id]||{}) : {};
    const gHome = (ovr.home && ovr.home.trim()) ? ovr.home : g.home;
    const gAway = (ovr.away && ovr.away.trim()) ? ovr.away : g.away;
    const r=getResult(g.id), gu=myGuesses[g.id];
    const pts=r&&gu?calcPoints(gu,r,g.group):null;
    const past=isPast(g.date), today=isToday(g.date);
    const hasR=r&&r.home!==undefined&&r.home!=="";
    const locked=past&&!adminUnlocked;
    const border=pts>=6?"#009c3b":pts>=3?"#c8a200":pts>0?"#1a6e8a":pts===0&&hasR?"#5a1010":today?"#ffdf00":hasR?"#009c3b":"#1a2e1a";
    const bg=pts>=6?"rgba(0,156,59,.1)":pts>=3?"rgba(200,162,0,.08)":pts>0?"rgba(26,110,138,.08)":pts===0&&hasR?"rgba(90,16,16,.1)":today?"rgba(255,223,0,.06)":"rgba(255,255,255,.02)";

    return(
      <div style={{background:bg,border:`2px solid ${border}`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
        {/* Header */}
        <div style={{background:today?"rgba(255,223,0,.14)":"rgba(255,255,255,.05)",
          borderBottom:`1px solid ${border}`,padding:"8px 14px",
          display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {today&&<span style={{background:"#cc0000",color:"#fff",fontSize:fs(10),fontWeight:700,padding:"2px 8px",borderRadius:20}}>🔴 HOJE</span>}
            <span style={{fontSize:fs(14),color:"#ffdf00",fontWeight:700}}>{fmtDate(g.date)}</span>
            <span style={{fontSize:fs(20),color:"#fff",fontWeight:900,letterSpacing:2}}>{fmtTime(g.date)}</span>
            <span style={{fontSize:fs(11),color:"#666"}}>📍{g.city}</span>
          </div>
          <span style={{fontFamily:"sans-serif",fontSize:fs(10),
            background:g.knockout?"#3a0050":"#002776",
            color:g.knockout?"#ddaaff":"#aaa",padding:"2px 8px",borderRadius:20}}>
            {g.knockout?g.group:`GR.${g.group}`}
          </span>
        </div>

        {/* Confronto */}
        <div style={{padding:"14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
            {/* Casa */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <Flag team={gHome} size={fs(40)}/>
              <span style={{fontSize:fs(13),fontWeight:700,textAlign:"center",fontFamily:"sans-serif"}}>{gHome}</span>
            </div>

            {/* Placar central */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              {mode==="meus" ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min="0" max="20" value={gu?.home??""} disabled={locked}
                      onChange={e=>saveGuess(g.id,"home",e.target.value)} placeholder="–"
                      style={{width:fs(52),height:fs(52),textAlign:"center",
                        background:locked?"#0a0a0a":"#060f06",color:locked?"#444":"#fff",
                        border:`3px solid ${locked?"#1a1a1a":"#009c3b"}`,
                        borderRadius:8,fontSize:fs(24),fontFamily:"monospace",
                        cursor:locked?"not-allowed":"text"}}/>
                    <span style={{color:locked?"#333":"#ffdf00",fontSize:fs(22),fontWeight:900}}>×</span>
                    <input type="number" min="0" max="20" value={gu?.away??""} disabled={locked}
                      onChange={e=>saveGuess(g.id,"away",e.target.value)} placeholder="–"
                      style={{width:fs(52),height:fs(52),textAlign:"center",
                        background:locked?"#0a0a0a":"#060f06",color:locked?"#444":"#fff",
                        border:`3px solid ${locked?"#1a1a1a":"#009c3b"}`,
                        borderRadius:8,fontSize:fs(24),fontFamily:"monospace",
                        cursor:locked?"not-allowed":"text"}}/>
                  </div>
                  {locked&&(
                    <div style={{display:"flex",alignItems:"center",gap:5,
                      background:"rgba(80,0,0,.3)",border:"1px solid #3a1010",
                      borderRadius:20,padding:"3px 10px",fontFamily:"sans-serif",fontSize:fs(11),color:"#ff8888"}}>
                      🔒 Encerrado às {fmtTime(g.date)} — jogo iniciado
                    </div>
                  )}
                  {/* Seletor "Quem passa?" - só em mata-mata quando o palpite empata */}
                  {!locked && g.knockout && gu?.home!==undefined && gu?.home!=="" &&
                    gu?.away!==undefined && gu?.away!=="" && Number(gu.home)===Number(gu.away) && (
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                      marginTop:4,background:"rgba(255,223,0,.06)",border:"1px solid rgba(255,223,0,.25)",
                      borderRadius:10,padding:"6px 10px"}}>
                      <div style={{fontFamily:"sans-serif",fontSize:fs(10),color:"#ffdf00",letterSpacing:1}}>
                        🤔 Empate! Quem passa?
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>saveGuess(g.id,"quemPassa","home")}
                          style={{background:gu?.quemPassa==="home"?"#009c3b":"rgba(255,255,255,.08)",
                            color:"#fff",border:`1px solid ${gu?.quemPassa==="home"?"#00ff7f":"#333"}`,
                            borderRadius:7,padding:"4px 10px",cursor:"pointer",
                            fontFamily:"sans-serif",fontSize:fs(11),fontWeight:700}}>
                          {gHome}
                        </button>
                        <button onClick={()=>saveGuess(g.id,"quemPassa","away")}
                          style={{background:gu?.quemPassa==="away"?"#009c3b":"rgba(255,255,255,.08)",
                            color:"#fff",border:`1px solid ${gu?.quemPassa==="away"?"#00ff7f":"#333"}`,
                            borderRadius:7,padding:"4px 10px",cursor:"pointer",
                            fontFamily:"sans-serif",fontSize:fs(11),fontWeight:700}}>
                          {gAway}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : mode==="admin" ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min="0" max="20" value={r?.home??""} onChange={e=>saveResult(g.id,"home",e.target.value)} placeholder="–"
                      style={{width:fs(52),height:fs(52),textAlign:"center",background:"#060f06",color:"#ffdf00",
                        border:"3px solid #ffdf00",borderRadius:8,fontSize:fs(24),fontFamily:"monospace"}}/>
                    <span style={{color:"#fff",fontSize:fs(22),fontWeight:900}}>×</span>
                    <input type="number" min="0" max="20" value={r?.away??""} onChange={e=>saveResult(g.id,"away",e.target.value)} placeholder="–"
                      style={{width:fs(52),height:fs(52),textAlign:"center",background:"#060f06",color:"#ffdf00",
                        border:"3px solid #ffdf00",borderRadius:8,fontSize:fs(24),fontFamily:"monospace"}}/>
                  </div>
                  {/* Admin define quem passou no empate (pênaltis/prorrogação) */}
                  {g.knockout && r?.home!==undefined && r?.home!=="" &&
                    r?.away!==undefined && r?.away!=="" && Number(r.home)===Number(r.away) && (
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                      background:"rgba(255,223,0,.08)",border:"1px solid rgba(255,223,0,.3)",
                      borderRadius:10,padding:"6px 10px"}}>
                      <div style={{fontFamily:"sans-serif",fontSize:fs(10),color:"#ffdf00",letterSpacing:1}}>
                        ⚖️ Empate — quem passou?
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>saveResult(g.id,"quemPassa","home")}
                          style={{background:r?.quemPassa==="home"?"#009c3b":"rgba(255,255,255,.08)",
                            color:"#fff",border:`1px solid ${r?.quemPassa==="home"?"#00ff7f":"#333"}`,
                            borderRadius:7,padding:"4px 10px",cursor:"pointer",
                            fontFamily:"sans-serif",fontSize:fs(11),fontWeight:700}}>
                          {gHome}
                        </button>
                        <button onClick={()=>saveResult(g.id,"quemPassa","away")}
                          style={{background:r?.quemPassa==="away"?"#009c3b":"rgba(255,255,255,.08)",
                            color:"#fff",border:`1px solid ${r?.quemPassa==="away"?"#00ff7f":"#333"}`,
                            borderRadius:7,padding:"4px 10px",cursor:"pointer",
                            fontFamily:"sans-serif",fontSize:fs(11),fontWeight:700}}>
                          {gAway}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : hasR ? (
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:fs(36),color:"#ffdf00",fontWeight:900,fontFamily:"monospace",letterSpacing:4,lineHeight:1}}>
                    {r.home}<span style={{color:"#555",fontSize:fs(22)}}> × </span>{r.away}
                  </div>
                  <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#009c3b",marginTop:2}}>✅ Finalizado</div>
                </div>
              ) : (
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:fs(28),color:"#2a2a2a",fontFamily:"monospace",letterSpacing:4}}>– × –</div>
                  <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:today?"#ffdf00":"#555",marginTop:2}}>
                    {today?"🕐 Em breve":past?"⏳ Aguardando":"📅 "+fmtDate(g.date)}
                  </div>
                </div>
              )}

              {/* Badge pontos */}
              {mode==="meus"&&hasR&&gu&&(
                <div style={{background:pts>=6?"#009c3b":pts>=3?"#c8a200":pts>0?"#1a6e8a":"#5a1010",
                  color:"#fff",borderRadius:20,padding:"4px 14px",fontFamily:"sans-serif",fontSize:fs(13),fontWeight:700}}>
                  {pts===7?"🎯 7 pontos!":pts===6?"🎯 6 pontos!":pts===4?"✅ 4 pontos":
                   pts===3?"✅ 3 pontos":pts===1?"✅ 1 ponto":"❌ 0 ponto"}
                </div>
              )}
              {mode==="meus"&&locked&&!hasR&&<span style={{fontSize:fs(12),color:"#444",fontFamily:"sans-serif"}}>🔒</span>}
            </div>

            {/* Visitante */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <Flag team={gAway} size={fs(40)}/>
              <span style={{fontSize:fs(13),fontWeight:700,textAlign:"center",fontFamily:"sans-serif"}}>{gAway}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={{...BASE_BG, background:THEME.bg, minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      <Notif n={notification}/>

      {/* HEADER */}
      <header>
        <div style={{background:"linear-gradient(135deg,#004d22,#009c3b 25%,#002776 60%,#001240)"}}>
          <div style={{background:"rgba(0,0,0,.55)",padding:"10px 16px",
            display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div style={{cursor:"pointer"}} onClick={()=>setSubScreen("menu")}>
              <div style={{fontSize:fs(28),letterSpacing:5,lineHeight:1}}>⚽ BOLÃO DO GESTOR</div>
              <div style={{fontSize:fs(11),color:"#ffdf00",fontFamily:"sans-serif",letterSpacing:3}}>
                {adminData.nome} · {bolaoAtual?.nome||""}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              {/* Controle de fonte */}
              <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,.08)",borderRadius:20,padding:"3px 10px"}}>
                <button onClick={()=>changeFs(-1)} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:4,width:22,height:22,cursor:"pointer",fontSize:14}}>−</button>
                <span style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#fff",fontWeight:700,minWidth:20,textAlign:"center"}}>A</span>
                <button onClick={()=>changeFs(1)}  style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:4,width:22,height:22,cursor:"pointer",fontSize:14}}>+</button>
              </div>
              {/* Tema claro/escuro */}
              <button onClick={toggleDark}
                style={{background:"rgba(255,255,255,.12)",border:"none",color:"#fff",
                  borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:fs(14),
                  display:"flex",alignItems:"center",gap:5}}>
                {darkMode?"☀️":"🌙"}
                <span style={{fontFamily:"sans-serif",fontSize:fs(11)}}>{darkMode?"Claro":"Escuro"}</span>
              </button>
              {/* Usuário */}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <MemberAvatar member={membrosAprovados.find(m=>m.uid===currentMember.uid)} size={30}/>
                <div>
                  <div style={{fontSize:fs(15),color:"#ffdf00"}}>{currentMember.apelido}</div>
                  <div style={{fontSize:fs(10),color:"#aaa",fontFamily:"sans-serif"}}>{myRank>0?`${myRank}º · ${myPts} pts`:"0 pts"}</div>
                </div>
              </div>
              <button onClick={()=>setCurrentMember(null)}
                style={{background:"#cc0000",border:"none",color:"#fff",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:fs(11),fontFamily:"sans-serif",fontWeight:700}}>
                🔄 Sair
              </button>
            </div>
          </div>
        </div>
        <BrStripe/>
      </header>

      {/* BARRA DE NAVEGAÇÃO FIXA */}
      <div style={{background:"rgba(0,0,0,.92)",borderBottom:"1px solid #1a2a1a",position:"sticky",top:0,zIndex:100}}>
        {/* Linha 1: botões de seção */}
        <div style={{padding:"6px 10px",display:"flex",alignItems:"center",gap:6,overflowX:"auto",flexWrap:"nowrap"}}>
          {[
            {icon:"⚽",label:"Meus Palpites",  sub:"meus",     bg:"#006622",active:"#009c3b"},
            {icon:"👀",label:"Palpites Bolão", sub:"todos",    bg:"#003355",active:"#005580"},
            {icon:"🏆",label:"Classificação",  sub:"ranking",  bg:"#7a5000",active:"#c8a200"},
            {icon:"📅",label:"Hoje",            sub:"hoje",     bg:"#6a0000",active:"#cc0000"},
            {icon:"🗓️",label:"Agenda",          sub:"agenda",   bg:"#1a1a6a",active:"#2a2aaa"},
            {icon:"🔐",label:"Admin",           sub:"admin",    bg:"#2a0040",active:"#6a00aa"},
          ].map(b=>(
            <button key={b.sub} onClick={()=>setSubScreen(b.sub)} style={{
              background:subScreen===b.sub?b.active:b.bg,
              color:"#fff",border:`1px solid ${subScreen===b.sub?b.active:"#333"}`,
              borderRadius:7,padding:"7px 12px",cursor:"pointer",
              fontSize:fs(12),fontWeight:700,flexShrink:0,whiteSpace:"nowrap",transition:".15s"
            }}>{b.icon} {b.label}</button>
          ))}
        </div>

        {/* Linha 2: filtros rápidos */}
        {["meus","todos","agenda","hoje"].includes(subScreen)&&(
          <div style={{padding:"0 10px 7px",display:"flex",alignItems:"center",gap:5,overflowX:"auto",flexWrap:"nowrap"}}>
            <span style={{fontFamily:"sans-serif",fontSize:fs(10),color:"#555",flexShrink:0}}>FILTRO:</span>
            {["Todos","Hoje",...GROUPS.map(g=>g),"16A","OIT","QUA","SEMI","FINAL"].map(g=>{
              const fgVal = GROUPS.includes(g)?"Grupo "+g:g==="Todos"?"Todos":g==="Hoje"?"Hoje":g==="16A"?"16 Avos":g==="OIT"?"Oitavas":g==="QUA"?"Quartas":g==="SEMI"?"Semifinal":g==="FINAL"?"Final":"3 Lugar";
              const active = filterGrp===fgVal||(filterGrp==="Grupo "+g&&GROUPS.includes(g));
              return(
                <button key={g} onClick={()=>setFilterGrp(fgVal)} style={{
                  background:active?"#ffdf00":"rgba(255,255,255,.07)",
                  color:active?"#000":"#aaa",border:`1px solid ${active?"#ffdf00":"#2a2a2a"}`,
                  borderRadius:6,padding:"4px 10px",cursor:"pointer",
                  fontSize:fs(11),fontWeight:active?700:400,flexShrink:0,fontFamily:"sans-serif"
                }}>{g}</button>
              );
            })}
          </div>
        )}
      </div>

      <main style={{maxWidth:760,margin:"0 auto",padding:"16px 12px"}}>

        {/* MENU */}
        {subScreen==="menu"&&(
          <div style={{maxWidth:500,margin:"0 auto",padding:"16px 0"}}>
            <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#777",textAlign:"center",marginBottom:16,letterSpacing:2}}>
              OLÁ, {currentMember.apelido.toUpperCase()}!
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {icon:"⚽",label:"Meus\nPalpites",        sub:"meus",    color:"linear-gradient(135deg,#006622,#009c3b)"},
                {icon:"👀",label:"Palpites\ndo Bolão",    sub:"todos",   color:"linear-gradient(135deg,#003355,#005580)"},
                {icon:"🏆",label:"Classificação\ndo Bolão",sub:"ranking",color:"linear-gradient(135deg,#7a5000,#c8a200)"},
                {icon:"📅",label:"Jogos\nde Hoje",        sub:"hoje",    color:"linear-gradient(135deg,#6a0000,#cc0000)"},
                {icon:"🗓️",label:"Tabela\ndos Jogos",     sub:"agenda",  color:"linear-gradient(135deg,#1a1a6a,#2a2aaa)"},
                {icon:"🔐",label:"Adminis-\ntrador",       sub:"admin",   color:"linear-gradient(135deg,#2a0040,#6a00aa)"},
              ].map(b=>(
                <button key={b.sub} className="hbtn" onClick={()=>setSubScreen(b.sub)}
                  style={{background:b.color,border:"none",borderRadius:16,padding:"22px 12px",
                    cursor:"pointer",color:"#fff",textAlign:"center",minHeight:120,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
                    boxShadow:"0 4px 20px rgba(0,0,0,.4)"}}>
                  <div style={{fontSize:fs(40)}}>{b.icon}</div>
                  <div style={{fontSize:fs(17),letterSpacing:2,lineHeight:1.2,whiteSpace:"pre-line"}}>{b.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MEUS PALPITES */}
        {subScreen==="meus"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <MemberAvatar member={membrosAprovados.find(m=>m.uid===currentMember.uid)} size={fs(32)}/>
              <span style={{fontSize:fs(20),color:"#ffdf00",letterSpacing:2}}>{currentMember.apelido}</span>
              <span style={{fontFamily:"sans-serif",fontSize:fs(11),color:darkMode?"#555":"#888"}}>
                {filteredGames().filter(g=>myGuesses[g.id]?.home!==undefined).length}/{filteredGames().length} preenchidos
              </span>
            </div>
            {filteredGames().map(g=><GameRow key={g.id} g={g} mode="meus"/>)}

            {/* Classificação do grupo pelos palpites */}
            {(filterGrp==="Todos"||filterGrp.startsWith("Grupo "))&&(()=>{
              const grupos = filterGrp==="Todos" ? GROUPS : [filterGrp.replace("Grupo ","")];
              return grupos.map(grp=>{
                const st = getGroupStandings(grp);
                if(st.length===0) return null;
                return(
                  <div key={grp} style={{marginTop:14,background:darkMode?"rgba(255,223,0,.05)":"rgba(0,100,40,.08)",
                    border:"1px solid rgba(255,223,0,.2)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                    <div style={{background:"rgba(255,223,0,.12)",padding:"8px 14px",
                      fontSize:fs(13),letterSpacing:3,color:"#ffdf00"}}>
                      📊 CLASSIFICAÇÃO GRUPO {grp} — SEU PALPITE
                    </div>
                    <div style={{padding:"8px 14px"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"sans-serif",fontSize:fs(11)}}>
                        <thead>
                          <tr style={{borderBottom:`1px solid ${darkMode?"#1a2a1a":"#c8d8c8"}`}}>
                            {["#","Time","Pts","J","V","E","D","GP","GC","SG"].map(h=>(
                              <th key={h} style={{textAlign:h==="Time"?"left":"center",
                                padding:"4px 5px",color:darkMode?"#888":"#666",fontWeight:700,fontSize:fs(10)}}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {st.map((s,i)=>(
                            <tr key={s.team} style={{
                              background:i<2?(darkMode?"rgba(0,156,59,.12)":"rgba(0,156,59,.07)"):"transparent",
                              borderBottom:`1px solid ${darkMode?"#0a1a0a":"#e0e8e0"}`
                            }}>
                              <td style={{padding:"5px",textAlign:"center",fontWeight:700,
                                color:i===0?"#ffdf00":i===1?"#aaa":darkMode?"#fff":"#333",fontSize:fs(12)}}>
                                {i+1}°
                              </td>
                              <td style={{padding:"5px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:5}}>
                                  <Flag team={s.team} size={fs(16)}/>
                                  <span style={{color:darkMode?"#fff":"#1a2a1a",fontWeight:i<2?700:400,fontSize:fs(12)}}>{s.team}</span>
                                </div>
                              </td>
                              {[s.pts,s.jogos,s.vit,s.emp,s.der,s.gp,s.gc,s.saldo].map((v,j)=>(
                                <td key={j} style={{padding:"5px",textAlign:"center",
                                  color:j===0?(darkMode?"#ffdf00":"#009c3b"):darkMode?"#aaa":"#555",
                                  fontWeight:j===0?700:400,fontSize:fs(12)}}>
                                  {v}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{fontFamily:"sans-serif",fontSize:fs(10),color:darkMode?"#444":"#999",marginTop:5}}>
                        🟢 Top 2 classificam para 16 Avos · Baseado nos seus palpites
                      </div>
                    </div>
                  </div>
                );
              });
            })()}

            {/* Confrontos 16A gerados pelos palpites */}
            {filterGrp==="Todos"&&GROUPS.some(g=>getGroupStandings(g).length>0)&&(
              <div style={{marginTop:14,background:darkMode?"rgba(60,0,120,.1)":"rgba(60,0,120,.05)",
                border:"1px solid rgba(100,0,200,.3)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                <div style={{background:"rgba(100,0,200,.2)",padding:"8px 14px",
                  fontSize:fs(13),letterSpacing:3,color:"#cc88ff"}}>
                  ⚡ FASE 16 AVOS — CONFRONTOS DO SEU PALPITE
                </div>
                <div style={{padding:"10px 14px",display:"grid",gap:6}}>
                  {get16AConfrontos().map((c,i)=>(
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,
                      background:darkMode?"rgba(255,255,255,.03)":"rgba(60,0,120,.04)",
                      border:`1px solid ${darkMode?"#2a1a4a":"#c8b8e8"}`,
                      borderRadius:8,padding:"8px 12px",fontFamily:"sans-serif"}}>
                      <span style={{color:darkMode?"#888":"#999",fontWeight:700,minWidth:20,fontSize:fs(11)}}>{i+1}</span>
                      <Flag team={c.home} size={fs(20)}/>
                      <span style={{flex:1,fontWeight:700,color:darkMode?"#fff":"#1a2a1a",fontSize:fs(13)}}>{c.home}</span>
                      <span style={{color:"#cc88ff",fontWeight:900,fontSize:fs(13),padding:"0 6px"}}>vs</span>
                      <span style={{flex:1,textAlign:"right",fontWeight:700,color:darkMode?"#fff":"#1a2a1a",fontSize:fs(13)}}>{c.away}</span>
                      <Flag team={c.away} size={fs(20)}/>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:"sans-serif",fontSize:fs(10),color:darkMode?"#444":"#aaa",padding:"0 14px 10px"}}>
                  ⚡ Confrontos gerados automaticamente pelos seus palpites nos grupos
                </div>
              </div>
            )}

            <p style={{textAlign:"center",marginTop:12,fontFamily:"sans-serif",fontSize:fs(11),color:darkMode?"#444":"#aaa"}}>
              💾 Salvo em tempo real · 🔒 Bloqueado após início
            </p>
          </div>
        )}

        {/* PALPITES DO BOLÃO */}
        {subScreen==="todos"&&(
          <div>
            <div style={{fontSize:fs(22),letterSpacing:4,color:"#ffdf00",marginBottom:4}}>👀 PALPITES DO BOLÃO</div>
            <p style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#777",marginBottom:16}}>
              Palpites aparecem assim que cada participante registrar o seu.
            </p>
            {filteredGames().map(g=>{
              const r = getResult(g.id);
              const hasR = r&&r.home!==undefined&&r.home!=="";
              const today = isToday(g.date);
              const ovr = g.id>=101 ? (scheduleOverrides[g.id]||{}) : {};
              const gHome = (ovr.home && ovr.home.trim()) ? ovr.home : g.home;
              const gAway = (ovr.away && ovr.away.trim()) ? ovr.away : g.away;
              const palpites = membrosAprovados.map(m=>{
                const gu=getGuessOf(m.uid,g.id);
                const pts=hasR&&gu?calcPoints(gu,r,g.group):null;
                const isMine = m.uid===currentMember?.uid;
                // Ocultar palpites de outros até o jogo começar (jogo mata-mata)
                const guVisivel = (isMine || isPast(g.date) || hasR) ? gu : null;
                return {m, gu:guVisivel, palpiteReal:gu, pts, isMine};
              }).filter(p=>p.palpiteReal?.home!==undefined);

              if(palpites.length===0) return null;

              return(
                <div key={g.id} style={{background:"rgba(255,255,255,.03)",
                  border:`1px solid ${hasR?"#009c3b":today?"#ffdf00":"#1a2e1a"}`,
                  borderRadius:14,overflow:"hidden",marginBottom:14}}>
                  {/* Header do jogo */}
                  <div style={{background:today?"rgba(255,223,0,.12)":"rgba(255,255,255,.05)",
                    borderBottom:`1px solid ${hasR?"#009c3b":today?"#ffdf00":"#1a2e1a"}`,
                    padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Flag team={gHome} size={fs(28)}/>
                      <span style={{fontSize:fs(16),fontWeight:700}}>{gHome}</span>
                      <span style={{color:"#555"}}>×</span>
                      <span style={{fontSize:fs(16),fontWeight:700}}>{gAway}</span>
                      <Flag team={gAway} size={fs(28)}/>
                    </div>
                    <div style={{textAlign:"right"}}>
                      {hasR?(
                        <span style={{fontSize:fs(22),color:"#ffdf00",fontWeight:900,fontFamily:"monospace"}}>{r.home}×{r.away}</span>
                      ):(
                        <div>
                          <div style={{fontSize:fs(13),color:"#ffdf00",fontWeight:700}}>{fmtDate(g.date)}</div>
                          <div style={{fontSize:fs(14),color:"#fff",fontWeight:900}}>{fmtTime(g.date)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de palpites */}
                  <div style={{padding:"12px 16px"}}>
                    <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#888",letterSpacing:1,marginBottom:8}}>
                      PALPITES ({palpites.length}/{membrosAprovados.length}):
                    </div>
                    <div style={{display:"grid",gap:8}}>
                      {palpites.map(({m,gu,pts})=>{
                        const isMe=m.uid===currentMember.uid;
                        return(
                          <div key={m.uid} style={{
                            display:"flex",alignItems:"center",gap:10,
                            background:pts>=6?"rgba(0,156,59,.15)":pts>=3?"rgba(200,162,0,.12)":pts>0?"rgba(26,110,138,.12)":pts===0&&hasR?"rgba(90,16,16,.15)":isMe?"rgba(255,223,0,.06)":"rgba(255,255,255,.04)",
                            border:`1px solid ${pts>=6?"#009c3b":pts>=3?"#c8a200":pts>0?"#1a6e8a":pts===0&&hasR?"#5a1010":isMe?"rgba(255,223,0,.3)":"#1a1a1a"}`,
                            borderRadius:10,padding:"10px 14px"
                          }}>
                            <MemberAvatar member={m} size={fs(36)}/>
                            <div style={{flex:1}}>
                              <span style={{fontSize:fs(15),letterSpacing:1,color:isMe?"#ffdf00":"#fff",fontWeight:isMe?700:400}}>
                                {m.apelido}{isMe&&<span style={{fontSize:fs(11),marginLeft:6,fontFamily:"sans-serif"}}>← você</span>}
                              </span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                              <Flag team={gHome} size={fs(20)}/>
                              <span style={{fontSize:fs(22),fontFamily:"monospace",fontWeight:900,
                                color:pts>=6?"#009c3b":pts>=3?"#c8a200":pts>0?"#1a9edb":pts===0&&hasR?"#ff6b6b":"#fff",letterSpacing:2}}>
                                {gu ? `${gu.home}×${gu.away}` : "🔒"}
                              </span>
                              <Flag team={gAway} size={fs(20)}/>
                            </div>
                            {pts!==null&&(
                              <div style={{background:pts>=6?"#009c3b":pts>=3?"#c8a200":pts>0?"#1a6e8a":"#5a1010",
                                color:"#fff",borderRadius:20,padding:"3px 10px",
                                fontFamily:"sans-serif",fontSize:fs(12),fontWeight:700,flexShrink:0}}>
                                {pts>=12?"🎯 "+pts+"pts":pts>=6?"🎯 "+pts+"pts":pts>=3?"✅ "+pts+"pts":pts>0?"✅ "+pts+"pt":"❌ 0"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Quem não palpitou */}
                      {membrosAprovados.filter(m=>!palpites.find(p=>p.m.uid===m.uid)).length>0&&(
                        <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#444",marginTop:2,fontStyle:"italic"}}>
                          Faltam: {membrosAprovados.filter(m=>!palpites.find(p=>p.m.uid===m.uid)).map(m=>m.apelido).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredGames().every(g=>membrosAprovados.every(m=>getGuessOf(m.uid,g.id)?.home===undefined))&&(
              <div style={{textAlign:"center",padding:"40px",fontFamily:"sans-serif",color:"#555"}}>
                <div style={{fontSize:40,marginBottom:12}}>⚽</div>
                <div style={{fontSize:16,color:"#777"}}>Nenhum palpite registrado ainda</div>
                <div style={{fontSize:13,marginTop:6}}>Vá em <strong style={{color:"#009c3b"}}>⚽ Meus Palpites</strong>!</div>
              </div>
            )}
          </div>
        )}

        {/* CLASSIFICAÇÃO */}
        {subScreen==="ranking"&&(
          <div>
            <div style={{fontSize:fs(24),letterSpacing:5,color:"#ffdf00",marginBottom:14}}>🏆 CLASSIFICAÇÃO</div>
            <div style={{display:"grid",gap:10}}>
              {ranking.map((p,i)=>{
                const isMe=p.uid===currentMember.uid;
                return(
                  <div key={p.uid} style={{
                    background:i===0?"linear-gradient(90deg,rgba(255,215,0,.18),transparent)":
                      i===1?"linear-gradient(90deg,rgba(192,192,192,.1),transparent)":
                      i===2?"linear-gradient(90deg,rgba(205,127,50,.1),transparent)":"rgba(255,255,255,.03)",
                    border:`2px solid ${isMe?"#ffdf00":i===0?"rgba(255,215,0,.4)":"#1a1a1a"}`,
                    borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12
                  }}>
                    <div style={{fontSize:fs(28),width:40,textAlign:"center",flexShrink:0}}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":<span style={{fontFamily:"sans-serif",fontWeight:900,color:"#666",fontSize:fs(18)}}>{i+1}°</span>}
                    </div>
                    <MemberAvatar member={p} size={fs(38)}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:fs(19),letterSpacing:2,color:isMe?"#ffdf00":"#fff"}}>
                        {p.apelido}{isMe&&<span style={{fontSize:fs(11),color:"#ffdf00",marginLeft:8,fontFamily:"sans-serif"}}>← você</span>}
                      </div>
                      <div style={{fontSize:fs(11),color:"#666",fontFamily:"sans-serif"}}>🎯 {p.exact} exatos · ✅ {p.win} acertos</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:fs(32),color:isMe?"#ffdf00":"#fff",lineHeight:1,fontWeight:900}}>{p.pts}</div>
                      <div style={{fontSize:fs(10),color:"#555",fontFamily:"sans-serif"}}>PTS</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HOJE */}
        {subScreen==="hoje"&&(
          <div>
            <div style={{fontSize:fs(24),letterSpacing:4,color:"#ffdf00",marginBottom:4}}>📅 JOGOS DE HOJE</div>
            <div style={{fontFamily:"sans-serif",fontSize:fs(13),color:"#777",marginBottom:16}}>
              {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
            </div>
            {todayGames.length===0?(
              <div style={{textAlign:"center",padding:"50px",fontFamily:"sans-serif",color:"#555"}}>
                <div style={{fontSize:48,marginBottom:12}}>⚽</div>
                <div>Nenhum jogo hoje.</div>
              </div>
            ):(
              todayGames.map(g=><GameRow key={g.id} g={g}/>)
            )}
          </div>
        )}

        {/* AGENDA */}
        {subScreen==="agenda"&&(
          <div>
            {filteredGames().map(g=><GameRow key={g.id} g={g}/>)}
          </div>
        )}

        {/* ADMIN */}
        {subScreen==="admin"&&(
          <div>
            {!adminUnlocked?(
              <div style={{maxWidth:380,margin:"20px auto",background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.3)",borderRadius:14,padding:"24px",textAlign:"center"}}>
                <div style={{fontSize:fs(44),marginBottom:8}}>🔐</div>
                <div style={{fontSize:fs(20),letterSpacing:3,color:"#ffdf00",marginBottom:14}}>ACESSO DO ADMINISTRADOR</div>
                <input type="password" placeholder="Senha do administrador" value={adminPass}
                  onChange={e=>setAdminPass(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(adminPass===admins[adminSlug]?.senha?setAdminUnlocked(true):notify("Senha incorreta","err"))}
                  style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #009c3b",
                    borderRadius:8,padding:"11px",fontSize:fs(16),fontFamily:"sans-serif",marginBottom:10,textAlign:"center"}}/>
                <button onClick={()=>adminPass===admins[adminSlug]?.senha?setAdminUnlocked(true):notify("Senha incorreta","err")}
                  style={{width:"100%",background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:fs(16),letterSpacing:2,cursor:"pointer"}}>
                  ENTRAR
                </button>
              </div>
            ):(
              <AdminBolaoPanel db={db} adminSlug={adminSlug} adminData={adminData} boloes={boloes} members={members}
                guesses={guesses} results={results} scheduleOverrides={scheduleOverrides} filteredGames={filteredGames} filterGrp={filterGrp} setFilterGrp={setFilterGrp}
                FILTER_OPTS={FILTER_OPTS} notify={notify} fs={fs} apiKey={apiKey} setApiKey={setApiKey}
                liveFetching={liveFetching} setLiveFetching={setLiveFetching}
                lastUpdate={lastUpdate} setLastUpdate={setLastUpdate} saveResult={saveResult}
                avatarColors={AVATAR_COLORS} avatares={AVATARES} MemberAvatar={MemberAvatar}/>
            )}
          </div>
        )}

      </main>

      <BrStripe/>
      <div style={{textAlign:"center",padding:"14px",fontFamily:"sans-serif",fontSize:11,color:"#1a1a1a"}}>
        ⚽ Bolão do Gestor · By Prof. Isaac Martins · 🇧🇷 Brasil Rumo ao Hexa
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAINEL ADMIN DO BOLÃO — completo
// ══════════════════════════════════════════════════════════════════════════════
function AdminBolaoPanel({db, adminSlug, adminData, boloes, members, guesses, results, scheduleOverrides, filteredGames,
  filterGrp, setFilterGrp, FILTER_OPTS, notify, fs, apiKey, setApiKey,
  liveFetching, setLiveFetching, lastUpdate, setLastUpdate, saveResult,
  avatarColors, avatares, MemberAvatar}) {

  const [abaAdmin, setAbaAdmin] = useState("boloes");
  const [selectedBid, setSelectedBid] = useState(Object.keys(boloes)[0]||"");
  const [editMember, setEditMember] = useState(null);
  const [editGuessUid, setEditGuessUid] = useState(null); // uid do membro com palpites em edição
  const [newNome, setNewNome] = useState("");
  const [newApe, setNewApe] = useState("");
  const [newWa, setNewWa] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBolaoNome, setNewBolaoNome] = useState("");
  const [newBolaoDesc, setNewBolaoDesc] = useState("");

  const membrosDosBolao = Object.entries(members[selectedBid]||{}).map(([uid,m])=>({uid,...m}));
  const aprovados = membrosDosBolao.filter(m=>m.status==="aprovado");
  const pendentes = membrosDosBolao.filter(m=>m.status==="pendente");
  const totalMembros = Object.values(boloes).reduce((acc,b)=>{
    const bid = Object.entries(boloes).find(([,bv])=>bv===b)?.[0];
    return acc + Object.keys(members[bid]||{}).length;
  }, 0);

  // Verificar limites
  const numBoloes = Object.keys(boloes).length;
  const { maxBoloes, maxMembros } = getLimites(adminData);

  async function criarBolao() {
    if (!newBolaoNome.trim()) { notify("Digite o nome do bolão","err"); return; }
    if (numBoloes >= maxBoloes) { notify(`Limite de ${maxBoloes} bolões atingido!`,"err"); return; }
    const id = safeKey(newBolaoNome.trim())+"_"+Date.now();
    await set(dbRef(db,`boloes/${id}`),{
      nome:newBolaoNome.trim(), descricao:newBolaoDesc.trim()||"Copa do Mundo 2026",
      adminSlug, ativo:true, criadoEm:new Date().toISOString()
    });
    setNewBolaoNome(""); setNewBolaoDesc("");
    notify(`✅ Bolão "${newBolaoNome}" criado!`);
    setSelectedBid(id);
  }

  async function addMembro() {
    if (!newNome.trim()||!newApe.trim()) { notify("Nome e apelido obrigatórios","err"); return; }
    if (aprovados.length >= maxMembros) { notify(`Limite de ${maxMembros} participantes atingido!`,"err"); return; }
    const uid = safeKey(newApe.trim());
    if (members[selectedBid]?.[uid]) { notify("Apelido já existe","err"); return; }
    await set(dbRef(db,`members/${selectedBid}/${uid}`),{
      nome:newNome.trim(), apelido:newApe.trim(),
      whatsapp:newWa.trim(), email:newEmail.trim(),
      status:"aprovado", criadoEm:new Date().toISOString()
    });
    setNewNome(""); setNewApe(""); setNewWa(""); setNewEmail("");
    notify(`✅ ${newApe} adicionado!`);
  }

  async function adminSaveGuess(uid, gameId, side, val) {
    const key = `${safeKey(adminSlug)}_${safeKey(selectedBid)}_${safeKey(uid)}`;
    await set(dbRef(db,`guesses/${key}/${gameId}/${side}`), val);
  }
  async function saveMember(uid) {
    await update(dbRef(db,`members/${selectedBid}/${uid}`), editMember);
    setEditMember(null);
    notify("✅ Salvo!");
  }

  async function removeMembro(uid) {
    if (window.confirm("Remover este participante?")) {
      await remove(dbRef(db,`members/${selectedBid}/${uid}`));
      notify("Participante removido.");
    }
  }

  async function deleteBolao(bid, nome) {
    if (window.confirm(`Excluir o bolão "${nome}"? Esta ação não pode ser desfeita.`)) {
      await remove(dbRef(db,`boloes/${bid}`));
      notify(`🗑️ Bolão "${nome}" excluído.`);
      const restantes = Object.keys(boloes).filter(k=>k!==bid);
      setSelectedBid(restantes[0]||"");
    }
  }

  const tabStyle = t => ({
    background:abaAdmin===t?"#ffdf00":"rgba(255,255,255,.07)",
    color:abaAdmin===t?"#000":"#aaa",border:"none",cursor:"pointer",
    padding:"8px 14px",fontSize:fs(12),fontWeight:700,fontFamily:"sans-serif",
    letterSpacing:1,whiteSpace:"nowrap",borderRadius:6,transition:".15s"
  });

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{fontSize:fs(20),letterSpacing:4,color:"#ffdf00"}}>🔐 PAINEL DO ADMINISTRADOR</div>
        <span style={{background:"#009c3b",color:"#fff",fontFamily:"sans-serif",fontSize:fs(11),padding:"2px 10px",borderRadius:20,fontWeight:700}}>✅ Ativo</span>
        <span style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#888"}}>
          {numBoloes}/{maxBoloes} bolões · {aprovados.length}/{maxMembros} no bolão selecionado
        </span>
      </div>

      {/* Abas */}
      <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",flexWrap:"wrap"}}>
        {[
          {id:"boloes",     label:"🏆 Bolões"},
          {id:"participantes",label:"👥 Participantes"},
          {id:"resultados", label:"⚽ Resultados"},
          {id:"config",     label:"⚙️ Config"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setAbaAdmin(t.id)} style={tabStyle(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ABA BOLÕES */}
      {abaAdmin==="boloes"&&(
        <div>
          {numBoloes < maxBoloes && (
            <div style={{background:"rgba(0,156,59,.08)",border:"1px solid rgba(0,156,59,.3)",borderRadius:12,padding:"16px",marginBottom:16}}>
              <div style={{fontSize:fs(16),letterSpacing:3,color:"#009c3b",marginBottom:10}}>➕ CRIAR NOVO BOLÃO</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <input placeholder="Nome do bolão" value={newBolaoNome} onChange={e=>setNewBolaoNome(e.target.value)}
                  style={{flex:1,minWidth:160,background:"#050d0a",color:"#fff",border:"2px solid #009c3b",borderRadius:8,padding:"9px 12px",fontSize:fs(14),fontFamily:"sans-serif"}}/>
                <input placeholder="Descrição (opcional)" value={newBolaoDesc} onChange={e=>setNewBolaoDesc(e.target.value)}
                  style={{flex:1,minWidth:160,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:8,padding:"9px 12px",fontSize:fs(13),fontFamily:"sans-serif"}}/>
                <button onClick={criarBolao} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:fs(14),fontWeight:700}}>Criar</button>
              </div>
            </div>
          )}
          {numBoloes >= maxBoloes && (
            <div style={{background:"rgba(255,223,0,.08)",border:"1px solid rgba(255,223,0,.3)",borderRadius:10,padding:"12px 16px",marginBottom:16,fontFamily:"sans-serif",fontSize:fs(13),color:"#ffdf00"}}>
              ⚠️ Limite de {maxBoloes} bolões atingido.
            </div>
          )}
          {Object.entries(boloes).map(([bid,b])=>(
            <div key={bid} style={{background:`rgba(255,255,255,.03)`,border:`2px solid ${selectedBid===bid?"#ffdf00":"#1a2a1a"}`,borderRadius:12,marginBottom:10,overflow:"hidden",cursor:"pointer"}}
              onClick={()=>setSelectedBid(bid)}>
              <div style={{background:selectedBid===bid?"linear-gradient(90deg,#7a5000,#c8a200)":"linear-gradient(90deg,#004d22,#009c3b)",padding:"11px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontSize:fs(17),letterSpacing:2}}>{b.nome}</div>
                  <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"rgba(255,255,255,.6)"}}>
                    {b.descricao} · ✅ {Object.values(members[bid]||{}).filter(m=>m.status==="aprovado").length} participantes · {b.ativo?"🟢":"🔴"}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={e=>{e.stopPropagation();
                    const n=window.prompt("Novo nome:",b.nome);
                    if(n?.trim()) update(dbRef(db,`boloes/${bid}`),{nome:n.trim()}).then(()=>notify("✅ Renomeado!"));
                  }} style={{background:"rgba(255,255,255,.2)",color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:fs(12),fontWeight:700,fontFamily:"sans-serif"}}>✏️</button>
                  <button onClick={e=>{e.stopPropagation();deleteBolao(bid,b.nome);}}
                    style={{background:"rgba(120,16,16,.7)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:fs(12),fontFamily:"sans-serif"}}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA PARTICIPANTES */}
      {abaAdmin==="participantes"&&(
        <div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
            <span style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#888"}}>BOLÃO:</span>
            <select value={selectedBid} onChange={e=>setSelectedBid(e.target.value)}
              style={{background:"#050d0a",color:"#ffdf00",border:"2px solid #009c3b",borderRadius:6,padding:"7px 12px",fontSize:fs(14),cursor:"pointer"}}>
              {Object.entries(boloes).map(([bid,b])=><option key={bid} value={bid}>{b.nome}</option>)}
            </select>
            <span style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#888"}}>{aprovados.length}/{maxMembros} participantes</span>
          </div>

          {/* Pendentes */}
          {pendentes.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#ffdf00",letterSpacing:1,marginBottom:8}}>⏳ PENDENTES ({pendentes.length})</div>
              {pendentes.map(m=>(
                <div key={m.uid} style={{background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <MemberAvatar member={m} size={fs(36)}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:fs(15)}}>{m.apelido}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#888"}}>👤 {m.nome}{m.whatsapp&&<> · 📱 {m.whatsapp}</>}</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>update(dbRef(db,`members/${selectedBid}/${m.uid}`),{status:"aprovado"}).then(()=>notify("✅ Aprovado!"))}
                      style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:fs(13),fontWeight:700}}>✅</button>
                    <button onClick={()=>update(dbRef(db,`members/${selectedBid}/${m.uid}`),{status:"rejeitado"}).then(()=>notify("Rejeitado","err"))}
                      style={{background:"#7a1010",color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:fs(13),fontWeight:700}}>❌</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aprovados */}
          <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#009c3b",letterSpacing:1,marginBottom:8}}>✅ APROVADOS ({aprovados.length})</div>
          {aprovados.map(m=>(
            <div key={m.uid} style={{background:"rgba(0,156,59,.06)",border:"1px solid rgba(0,156,59,.2)",borderRadius:10,padding:"10px 14px",marginBottom:8}}>
              {editMember?.uid===m.uid?(
                <div style={{display:"grid",gap:8}}>
                  {[{l:"Nome",k:"nome"},{l:"Apelido",k:"apelido"},{l:"WhatsApp",k:"whatsapp"},{l:"Email",k:"email"}].map(f=>(
                    <div key={f.k}>
                      <div style={{fontFamily:"sans-serif",fontSize:fs(10),color:"#888",marginBottom:3}}>{f.l}</div>
                      <input value={editMember[f.k]||""} onChange={e=>setEditMember(p=>({...p,[f.k]:e.target.value}))}
                        style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #009c3b",borderRadius:6,padding:"7px 10px",fontSize:fs(13),fontFamily:"sans-serif"}}/>
                    </div>
                  ))}
                  {/* Seletor de avatar */}
                  <div>
                    <div style={{fontFamily:"sans-serif",fontSize:fs(10),color:"#888",marginBottom:5}}>AVATAR</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",background:"#050d0a",borderRadius:8,padding:"8px",border:"1px solid #009c3b"}}>
                      {avatares.map(av=>(
                        <button key={av} onClick={()=>setEditMember(p=>({...p,avatar:av}))}
                          style={{background:editMember.avatar===av?"rgba(0,156,59,.4)":"transparent",
                            border:`2px solid ${editMember.avatar===av?"#009c3b":"transparent"}`,
                            borderRadius:6,padding:"3px",cursor:"pointer",fontSize:fs(22),lineHeight:1}}>
                          {av}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}}>
                      {avatarColors.map((c,i)=>(
                        <button key={c} onClick={()=>setEditMember(p=>({...p,avatarColor:i}))}
                          style={{width:24,height:24,borderRadius:"50%",background:c,
                            border:`3px solid ${editMember.avatarColor===i?"#fff":"transparent"}`,cursor:"pointer"}}/>
                      ))}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,fontFamily:"sans-serif",fontSize:fs(11),color:"#888"}}>
                      Preview: <MemberAvatar member={editMember} size={fs(36)}/> <span style={{fontSize:fs(14),color:"#fff"}}>{editMember.apelido}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>saveMember(m.uid)} style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontSize:fs(14),fontWeight:700}}>💾 Salvar</button>
                    <button onClick={()=>setEditMember(null)} style={{background:"#333",color:"#aaa",border:"none",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:fs(13),fontFamily:"sans-serif"}}>Cancelar</button>
                  </div>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <MemberAvatar member={m} size={fs(38)}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:fs(15),letterSpacing:1}}>{m.apelido}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#777"}}>
                      👤 {m.nome}{m.whatsapp&&<> · 📱 {m.whatsapp}</>}{m.email&&<> · ✉️ {m.email}</>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setEditGuessUid(editGuessUid===m.uid?null:m.uid)} style={{background:editGuessUid===m.uid?"rgba(0,156,59,.4)":"rgba(0,156,59,.15)",color:"#00ff7f",border:"1px solid rgba(0,156,59,.4)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:fs(12),fontFamily:"sans-serif",fontWeight:700}}>🎯</button>
                    <button onClick={()=>setEditMember({...m})} style={{background:"rgba(255,223,0,.15)",color:"#ffdf00",border:"1px solid rgba(255,223,0,.3)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:fs(12),fontFamily:"sans-serif",fontWeight:700}}>✏️</button>
                    <button onClick={()=>removeMembro(m.uid)} style={{background:"rgba(120,16,16,.3)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:fs(12),fontFamily:"sans-serif"}}>🗑️</button>
                  </div>
                </div>
              )}

              {/* PAINEL DE PALPITES MANUAIS (admin) */}
              {editGuessUid===m.uid&&(
                <div style={{marginTop:10,background:"#050d0a",border:"1px solid rgba(0,156,59,.3)",
                  borderRadius:8,padding:"12px",maxHeight:380,overflowY:"auto"}}>
                  <div style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#00ff7f",
                    letterSpacing:1,marginBottom:10}}>
                    🎯 PALPITES DE {m.apelido?.toUpperCase()}
                  </div>
                  {SCHEDULE.map(g=>{
                    const key = `${safeKey(adminSlug)}_${safeKey(selectedBid)}_${safeKey(m.uid)}`;
                    const palpiteAtual = (guesses[key]||{})[g.id] || {};
                    const jaComecou = isPast(g.date);
                    return (
                      <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,
                        padding:"6px 0",borderBottom:"1px solid #1a2a1a",flexWrap:"wrap"}}>
                        <div style={{flex:1,minWidth:140,fontFamily:"sans-serif",fontSize:fs(11),
                          color:jaComecou?"#666":"#ccc"}}>
                          {g.home} <span style={{color:"#444"}}>x</span> {g.away}
                          <div style={{fontSize:fs(9),color:"#555"}}>{fmtDate(g.date)} {fmtTime(g.date)}</div>
                        </div>
                        <input type="number" min="0" placeholder="–" defaultValue={palpiteAtual.home??""}
                          onBlur={e=>adminSaveGuess(m.uid,g.id,"home",e.target.value)}
                          style={{width:38,background:"#0a1a0a",color:"#fff",border:"1px solid #2a3a2a",
                            borderRadius:5,padding:"4px",fontSize:fs(13),textAlign:"center"}}/>
                        <span style={{color:"#555"}}>x</span>
                        <input type="number" min="0" placeholder="–" defaultValue={palpiteAtual.away??""}
                          onBlur={e=>adminSaveGuess(m.uid,g.id,"away",e.target.value)}
                          style={{width:38,background:"#0a1a0a",color:"#fff",border:"1px solid #2a3a2a",
                            borderRadius:5,padding:"4px",fontSize:fs(13),textAlign:"center"}}/>
                      </div>
                    );
                  })}
                  <button onClick={()=>setEditGuessUid(null)}
                    style={{width:"100%",marginTop:10,background:"#1a3a1a",color:"#00ff7f",
                      border:"1px solid #009c3b",borderRadius:6,padding:"8px",cursor:"pointer",
                      fontFamily:"sans-serif",fontSize:fs(12),fontWeight:700}}>
                    ✅ Concluir edição
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Adicionar */}
          {aprovados.length < maxMembros && (
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a2a1a",borderRadius:10,padding:"14px",marginTop:8}}>
              <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#888",letterSpacing:1,marginBottom:8}}>➕ ADICIONAR PARTICIPANTE</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                {[{ph:"Nome completo *",val:newNome,set:setNewNome},{ph:"Apelido *",val:newApe,set:setNewApe},{ph:"WhatsApp",val:newWa,set:setNewWa},{ph:"Email",val:newEmail,set:setNewEmail}].map(f=>(
                  <input key={f.ph} type="text" placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}
                    style={{background:"#050d0a",color:"#fff",border:"1px solid #2a3a2a",borderRadius:6,padding:"8px 10px",fontSize:fs(13),fontFamily:"sans-serif"}}/>
                ))}
              </div>
              <button onClick={addMembro} style={{width:"100%",background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",border:"none",borderRadius:8,padding:"9px",cursor:"pointer",fontSize:fs(14),fontWeight:700}}>
                ➕ Adicionar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ABA RESULTADOS */}
      {abaAdmin==="resultados"&&(
        <div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
            <button onClick={()=>setFilterGrp(filterGrp==="Hoje"?"Todos":"Hoje")}
              style={{background:filterGrp==="Hoje"?"#cc0000":"rgba(204,0,0,.15)",
                color:"#fff",border:"1px solid #cc0000",borderRadius:20,padding:"7px 14px",
                fontSize:fs(13),fontWeight:700,fontFamily:"sans-serif",cursor:"pointer",
                display:"flex",alignItems:"center",gap:6}}>
              🔴 Jogos de Hoje
            </button>
            <select value={filterGrp} onChange={e=>setFilterGrp(e.target.value)}
              style={{background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:6,padding:"7px 10px",fontSize:fs(12),fontFamily:"sans-serif",cursor:"pointer"}}>
              {FILTER_OPTS.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          {filteredGames().length===0&&filterGrp==="Hoje"&&(
            <div style={{textAlign:"center",padding:"24px",fontFamily:"sans-serif",color:"#666",fontSize:fs(13)}}>
              📅 Nenhum jogo hoje. Clique no botão novamente para ver todos.
            </div>
          )}
          {filteredGames().map(g=>{
            const r=results[g.id]||{};
            const hasR=r.home!==undefined&&r.home!=="";
            const ovr=g.id>=101?(scheduleOverrides[g.id]||{}):{};
            const gHome=(ovr.home&&ovr.home.trim())?ovr.home:g.home;
            const gAway=(ovr.away&&ovr.away.trim())?ovr.away:g.away;
            return(
              <div key={g.id} style={{background:hasR?"rgba(0,156,59,.07)":"rgba(255,255,255,.02)",border:`1px solid ${hasR?"#009c3b":"#1a2a1a"}`,borderRadius:12,overflow:"hidden",marginBottom:8}}>
                <div style={{background:"rgba(255,255,255,.05)",borderBottom:`1px solid ${hasR?"#009c3b":"#1a2a1a"}`,padding:"7px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                  <div style={{fontFamily:"sans-serif",fontSize:fs(12),display:"flex",gap:10}}>
                    <span style={{color:"#ffdf00",fontWeight:700}}>{fmtDate(g.date)}</span>
                    <span style={{fontWeight:700}}>{fmtTime(g.date)} BRT</span>
                    <span style={{color:"#666"}}>📍{g.city}</span>
                  </div>
                  <span style={{fontFamily:"sans-serif",fontSize:fs(10),background:"#002776",color:"#aaa",padding:"2px 8px",borderRadius:20}}>
                    {g.knockout?g.group:`GR.${g.group}`}
                  </span>
                </div>
                <div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
                  <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:fs(14),fontWeight:700}}>{gHome}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min="0" max="20" value={r.home??""} onChange={e=>saveResult(g.id,"home",e.target.value)} placeholder="–"
                      style={{width:fs(50),height:fs(50),textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:8,fontSize:fs(22),fontFamily:"monospace"}}/>
                    <span style={{color:"#fff",fontSize:fs(20),fontWeight:900}}>×</span>
                    <input type="number" min="0" max="20" value={r.away??""} onChange={e=>saveResult(g.id,"away",e.target.value)} placeholder="–"
                      style={{width:fs(50),height:fs(50),textAlign:"center",background:"#060f06",color:"#ffdf00",border:"2px solid #ffdf00",borderRadius:8,fontSize:fs(22),fontFamily:"monospace"}}/>
                  </div>
                  <div style={{textAlign:"center",fontFamily:"sans-serif",fontSize:fs(14),fontWeight:700}}>{gAway}</div>
                </div>
                {/* Empate em jogo mata-mata: admin define quem passou (pênaltis/prorrogação) */}
                {g.knockout && r?.home!==undefined && r?.home!=="" &&
                  r?.away!==undefined && r?.away!=="" && Number(r.home)===Number(r.away) && (
                  <div style={{padding:"0 14px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <div style={{background:"rgba(255,223,0,.08)",border:"1px solid rgba(255,223,0,.3)",
                      borderRadius:10,padding:"8px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,width:"100%"}}>
                      <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#ffdf00",letterSpacing:1}}>
                        ⚖️ Empate — quem passou (pênaltis/prorrogação)?
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>saveResult(g.id,"quemPassa","home")}
                          style={{background:r?.quemPassa==="home"?"#009c3b":"rgba(255,255,255,.08)",
                            color:"#fff",border:`1px solid ${r?.quemPassa==="home"?"#00ff7f":"#333"}`,
                            borderRadius:8,padding:"6px 14px",cursor:"pointer",
                            fontFamily:"sans-serif",fontSize:fs(12),fontWeight:700}}>
                          {gHome}
                        </button>
                        <button onClick={()=>saveResult(g.id,"quemPassa","away")}
                          style={{background:r?.quemPassa==="away"?"#009c3b":"rgba(255,255,255,.08)",
                            color:"#fff",border:`1px solid ${r?.quemPassa==="away"?"#00ff7f":"#333"}`,
                            borderRadius:8,padding:"6px 14px",cursor:"pointer",
                            fontFamily:"sans-serif",fontSize:fs(12),fontWeight:700}}>
                          {gAway}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ABA CONFIG */}
      {abaAdmin==="config"&&(
        <div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
            <span style={{fontFamily:"sans-serif",fontSize:fs(12),color:"#888"}}>BOLÃO:</span>
            <select value={selectedBid} onChange={e=>setSelectedBid(e.target.value)}
              style={{background:"#050d0a",color:"#ffdf00",border:"2px solid #009c3b",borderRadius:6,padding:"7px 12px",fontSize:fs(14),cursor:"pointer"}}>
              {Object.entries(boloes).map(([bid,b])=><option key={bid} value={bid}>{b.nome}</option>)}
            </select>
          </div>
          {boloes[selectedBid]&&<BolaoConfigInline db={db} bid={selectedBid} bolao={boloes[selectedBid]} notify={notify} fs={fs}
            apiKey={apiKey} setApiKey={setApiKey} liveFetching={liveFetching}
            setLiveFetching={setLiveFetching} lastUpdate={lastUpdate} setLastUpdate={setLastUpdate}/>}
        </div>
      )}
    </div>
  );
}

function BolaoConfigInline({db, bid, bolao, notify, fs, apiKey, setApiKey, liveFetching, setLiveFetching, lastUpdate, setLastUpdate}) {
  const [nome, setNome] = useState(bolao.nome||"");
  const [desc, setDesc] = useState(bolao.descricao||"");
  const [ativo, setAtivo] = useState(bolao.ativo!==false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function fetchLive() {
    setLiveFetching(true);
    try {
      if (!apiKey) { notify("Configure a chave de API","warn"); setLiveFetching(false); return; }
      const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED&season=2026",
        {headers:{"X-Auth-Token":apiKey}});
      if (!res.ok) throw new Error();
      const data = await res.json();
      for (const m of (data.matches||[])) {
        const hn=(m.homeTeam?.shortName||"").toLowerCase().slice(0,4);
        const found=SCHEDULE.find(s=>s.home.toLowerCase().startsWith(hn));
        if(found&&m.score?.fullTime?.home!=null)
          await set(dbRef(db,`results/${found.id}`),{home:String(m.score.fullTime.home),away:String(m.score.fullTime.away)});
      }
      const t=new Date().toLocaleTimeString("pt-BR");
      setLastUpdate(t); localStorage.setItem("bg26_lu",t);
      notify("✅ Resultados atualizados!");
    } catch { notify("❌ Erro na API","err"); }
    setLiveFetching(false);
  }

  return(
    <div style={{display:"grid",gap:12}}>
      {[{label:"Nome do bolão",val:nome,set:setNome},{label:"Descrição",val:desc,set:setDesc}].map(f=>(
        <div key={f.label}>
          <div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#888",letterSpacing:1,marginBottom:4}}>{f.label.toUpperCase()}</div>
          <input type="text" value={f.val} onChange={e=>f.set(e.target.value)}
            style={{width:"100%",background:"#050d0a",color:"#fff",border:"1px solid #2a2a4a",borderRadius:8,padding:"10px 12px",fontSize:fs(14),fontFamily:"sans-serif"}}/>
        </div>
      ))}
      <label style={{fontFamily:"sans-serif",fontSize:fs(13),color:"#aaa",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
        <input type="checkbox" checked={ativo} onChange={e=>setAtivo(e.target.checked)} style={{width:18,height:18}}/>
        Bolão ativo (visível para participantes)
      </label>
      <button onClick={()=>update(dbRef(db,`boloes/${bid}`),{nome:nome.trim(),descricao:desc.trim(),ativo}).then(()=>notify("✅ Salvo!"))}
        style={{background:"linear-gradient(135deg,#1a1a6a,#2a2aaa)",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontSize:fs(14),fontWeight:700}}>
        💾 Salvar
      </button>

      {/* API */}
      <div style={{background:"rgba(0,156,59,.07)",border:"1px solid rgba(0,156,59,.3)",borderRadius:10,padding:"14px"}}>
        <div style={{fontSize:fs(14),letterSpacing:3,color:"#009c3b",marginBottom:8}}>🌐 API AUTOMÁTICA</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input type="text" placeholder="Chave football-data.org" value={apiKey}
            onChange={e=>{setApiKey(e.target.value);localStorage.setItem("bg26_apikey",e.target.value);}}
            style={{flex:1,minWidth:180,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:6,padding:"8px 12px",fontSize:fs(12),fontFamily:"monospace"}}/>
          <button onClick={fetchLive} disabled={liveFetching}
            style={{background:"#009c3b",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontSize:fs(13),fontWeight:700}}>
            {liveFetching?"⏳":"🔄"} Atualizar
          </button>
        </div>
        {lastUpdate&&<div style={{fontFamily:"sans-serif",fontSize:fs(11),color:"#666",marginTop:6}}>🕐 {lastUpdate}</div>}
      </div>

      {/* Excluir */}
      <div style={{borderTop:"1px solid #2a1010",paddingTop:12}}>
        {!confirmDel?(
          <button onClick={()=>setConfirmDel(true)}
            style={{width:"100%",background:"rgba(120,16,16,.3)",color:"#ffaaaa",border:"1px solid #5a1010",borderRadius:8,padding:"9px",cursor:"pointer",fontSize:fs(13),fontFamily:"sans-serif",fontWeight:700}}>
            🗑️ Excluir este Bolão
          </button>
        ):(
          <div style={{background:"rgba(120,16,16,.2)",border:"1px solid #7a1010",borderRadius:8,padding:"14px",textAlign:"center"}}>
            <div style={{fontFamily:"sans-serif",fontSize:fs(13),color:"#ffaaaa",marginBottom:12}}>⚠️ Confirmar exclusão permanente?</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>remove(dbRef(db,`boloes/${bid}`)).then(()=>notify("🗑️ Excluído."))}
                style={{background:"#7a1010",color:"#fff",border:"none",borderRadius:6,padding:"8px 18px",cursor:"pointer",fontSize:fs(13),fontWeight:700}}>✅ Sim</button>
              <button onClick={()=>setConfirmDel(false)}
                style={{background:"#2a2a2a",color:"#aaa",border:"none",borderRadius:6,padding:"8px 16px",cursor:"pointer",fontSize:fs(13),fontFamily:"sans-serif"}}>❌ Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAINEL MASTER — Isaac controla tudo
// ══════════════════════════════════════════════════════════════════════════════
function MasterPanel({db, admins, licencas, allBoloes, members, results, notify, notification}) {
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [esqueci, setEsqueci]   = useState(false);
  const [abaM, setAbaM]         = useState("admins");
  const [expandAdmin, setExpandAdmin] = useState(null);
  const [leads, setLeads] = useState({});
  const [newLicName, setNewLicName] = useState("");
  const [newLicQtd, setNewLicQtd]   = useState(1);
  const [newLicPlano, setNewLicPlano] = useState("pro");

  useEffect(()=>{
    if(!db) return;
    const r = dbRef(db,"master/leads");
    onValue(r, s=>setLeads(s.val()||{}));
    return ()=>off(r);
  },[db]);

    async function gerarLicencas() {
    for (let i=0; i<newLicQtd; i++) {
      const codigo = "BOLAO-" + Math.random().toString(36).slice(2,8).toUpperCase();
      await push(dbRef(db,"licencas"), {
        codigo, nome:newLicName.trim()||"Sem nome",
        plano: newLicPlano,
        usado:false, criadoEm:new Date().toISOString()
      });
    }
    notify(`✅ ${newLicQtd} licença(s) ${PLANOS[newLicPlano].nome} gerada(s)!`);
    setNewLicName(""); setNewLicQtd(1);
  }

  async function revogarAdmin(slug) {
    if (window.confirm(`Revogar acesso do admin "${slug}"?`)) {
      await update(dbRef(db,`admins/${slug}`),{ativo:false});
      notify("Admin revogado.");
    }
  }

  const tabS = t => ({
    background:abaM===t?"#ffdf00":"rgba(255,255,255,.07)",
    color:abaM===t?"#000":"#aaa",border:"none",cursor:"pointer",
    padding:"9px 16px",fontSize:13,fontWeight:700,fontFamily:"sans-serif",
    letterSpacing:1,whiteSpace:"nowrap",borderRadius:6
  });

  return(
    <div style={{...BASE_BG,minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      <BrStripe/>
      <Notif n={notification}/>

      <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>
        <div style={{fontSize:32,letterSpacing:6,color:"#ffdf00",marginBottom:20,textAlign:"center"}}>
          ⭐ PAINEL MASTER — Prof. Isaac Martins
        </div>

        {!unlocked?(
          <div style={{maxWidth:380,margin:"60px auto",background:"rgba(255,223,0,.07)",border:"1px solid rgba(255,223,0,.3)",borderRadius:14,padding:"28px",textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:8}}>🔐</div>
            <div style={{fontSize:20,letterSpacing:3,color:"#ffdf00",marginBottom:14}}>ACESSO RESTRITO</div>

            {!esqueci ? (<>
              <div style={{position:"relative",marginBottom:10}}>
                <input type={showPass?"text":"password"} placeholder="Senha Master" value={pass}
                  onChange={e=>setPass(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&(pass===MASTER_PASS?setUnlocked(true):notify("Senha incorreta","err"))}
                  style={{width:"100%",background:"#050d0a",color:"#fff",border:"2px solid #ffdf00",
                    borderRadius:8,padding:"11px 44px 11px 14px",fontSize:16,fontFamily:"sans-serif",textAlign:"center"}}/>
                <button onClick={()=>setShowPass(s=>!s)}
                  style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                    background:"transparent",border:"none",color:"#888",cursor:"pointer",fontSize:18}}>
                  {showPass?"🙈":"👁️"}
                </button>
              </div>
              <button onClick={()=>pass===MASTER_PASS?setUnlocked(true):notify("Senha incorreta","err")}
                style={{width:"100%",background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",
                  border:"none",borderRadius:8,padding:"12px",fontSize:17,letterSpacing:2,cursor:"pointer",marginBottom:12}}>
                ENTRAR ▶
              </button>
              <button onClick={()=>setEsqueci(true)}
                style={{background:"transparent",border:"none",color:"#888",cursor:"pointer",
                  fontSize:12,fontFamily:"sans-serif",textDecoration:"underline"}}>
                Esqueci minha senha
              </button>
            </>) : (
              <div style={{background:"rgba(255,255,255,.05)",border:"1px solid #333",borderRadius:10,padding:"16px",textAlign:"left"}}>
                <div style={{fontSize:14,letterSpacing:2,color:"#ffdf00",marginBottom:10}}>🔑 RECUPERAÇÃO DE SENHA</div>
                <div style={{fontFamily:"sans-serif",fontSize:13,color:"#aaa",lineHeight:1.8,marginBottom:12}}>
                  Para recuperar sua senha do Painel Master, entre em contato:<br/>
                  <a href="mailto:isaac.pim65@gmail.com" style={{color:"#ffdf00",textDecoration:"none",fontWeight:700}}>
                    📧 isaac.pim65@gmail.com
                  </a>
                </div>
                <div style={{background:"rgba(255,223,0,.08)",border:"1px solid rgba(255,223,0,.2)",borderRadius:8,padding:"10px 12px",fontFamily:"monospace",fontSize:12,color:"#ffdf00",marginBottom:12}}>
                  Dica: A senha padrão é <strong>isaacmartins2026</strong>
                </div>
                <button onClick={()=>setEsqueci(false)}
                  style={{width:"100%",background:"#333",color:"#aaa",border:"none",borderRadius:8,
                    padding:"9px",cursor:"pointer",fontSize:13,fontFamily:"sans-serif"}}>
                  ← Voltar
                </button>
              </div>
            )}
            <div style={{marginTop:14}}>
              <a href="/" style={{color:"#555",fontFamily:"sans-serif",fontSize:12,textDecoration:"none"}}>← Voltar ao início</a>
            </div>
          </div>
        ):(
          <>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
              {[
                {label:"Administradores",value:Object.keys(admins).length,icon:"👤"},
                {label:"Bolões Ativos",value:Object.keys(allBoloes).length,icon:"⚽"},
                {label:"Licenças Disponíveis",value:Object.values(licencas).filter(l=>!l.usado).length,icon:"🔑"},
                {label:"Total Participantes",value:Object.values(members).reduce((a,b)=>a+Object.keys(b).length,0),icon:"👥"},
              ].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,.04)",border:"1px solid #1a2a1a",borderRadius:10,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:28}}>{s.icon}</div>
                  <div style={{fontSize:28,color:"#ffdf00",fontWeight:900,lineHeight:1,marginTop:4}}>{s.value}</div>
                  <div style={{fontFamily:"sans-serif",fontSize:11,color:"#888",marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Abas */}
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {[
                {id:"admins",     label:"👤 Administradores"},
                {id:"participantes", label:"👥 Participantes"},
                {id:"licencas",   label:"🔑 Licenças"},
                {id:"leads",      label:"📋 Leads"},
              ].map(t=>(
                <button key={t.id} onClick={()=>setAbaM(t.id)} style={tabS(t.id)}>{t.label}</button>
              ))}
            </div>

            {/* ABA ADMINS */}
            {abaM==="admins"&&(
              <div>
                {Object.entries(admins).map(([slug,a])=>{
                  const seusBolaoes = Object.entries(allBoloes).filter(([,b])=>b.adminSlug===slug);
                  const totalMembros = seusBolaoes.reduce((acc,[bid])=>acc+Object.keys(members[bid]||{}).length,0);
                  const { maxBoloes } = getLimites(a);
                  const isExpanded = expandAdmin===slug;
                  return(
                    <div key={slug} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${a.ativo===false?"#5a1010":"#1a3a1a"}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
                      <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:18,letterSpacing:2}}>{a.nome}</div>
                          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginTop:2}}>
                            🔗 <strong style={{color:"#ffdf00"}}>{window.location.origin}/{slug}</strong>
                          </div>
                          <div style={{fontFamily:"sans-serif",fontSize:11,color:"#777",marginTop:2}}>
                            ⚽ {seusBolaoes.length}/{maxBoloes} bolões · 👥 {totalMembros} participantes · 📅 {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
                            {a.ativo===false&&<span style={{color:"#ff6b6b",marginLeft:8}}>🔴 REVOGADO</span>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          <button onClick={()=>setExpandAdmin(isExpanded?null:slug)}
                            style={{background:"rgba(255,223,0,.15)",color:"#ffdf00",border:"1px solid rgba(255,223,0,.3)",
                              borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>
                            {isExpanded?"▲ Fechar":"👥 Ver participantes"}
                          </button>
                          <a href={"/"+slug} target="_blank"
                            style={{background:"rgba(0,156,59,.2)",color:"#009c3b",border:"1px solid rgba(0,156,59,.3)",
                              borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700,textDecoration:"none"}}>
                            🔗 Ver
                          </a>
                          {a.ativo!==false&&(
                            <button onClick={()=>revogarAdmin(slug)}
                              style={{background:"rgba(120,16,16,.3)",color:"#ffaaaa",border:"1px solid #5a1010",
                                borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>
                              🚫 Revogar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandido: participantes deste admin */}
                      {isExpanded&&(
                        <div style={{borderTop:"1px solid #1a2a1a",padding:"12px 16px",background:"rgba(0,0,0,.3)"}}>
                          {seusBolaoes.length===0?(
                            <div style={{fontFamily:"sans-serif",fontSize:13,color:"#555"}}>Nenhum bolão criado ainda.</div>
                          ):(
                            seusBolaoes.map(([bid,b])=>{
                              const mems = Object.entries(members[bid]||{}).map(([uid,m])=>({uid,...m}));
                              const aprov = mems.filter(m=>m.status==="aprovado");
                              return(
                                <div key={bid} style={{marginBottom:14}}>
                                  <div style={{fontSize:15,letterSpacing:2,color:"#ffdf00",marginBottom:8}}>
                                    ⚽ {b.nome} <span style={{fontFamily:"sans-serif",fontSize:11,color:"#888"}}>({aprov.length} participantes)</span>
                                  </div>
                                  {aprov.length===0?(
                                    <div style={{fontFamily:"sans-serif",fontSize:12,color:"#555"}}>Nenhum participante ainda.</div>
                                  ):(
                                    <div style={{display:"grid",gap:6}}>
                                      {aprov.map(m=>(
                                        <div key={m.uid} style={{background:"rgba(255,255,255,.04)",border:"1px solid #1a2a1a",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
                                          <MemberAvatar member={m} size={30}/>
                                          <div style={{flex:1}}>
                                            <div style={{fontSize:14,letterSpacing:1}}>{m.apelido}</div>
                                            <div style={{fontFamily:"sans-serif",fontSize:11,color:"#777"}}>
                                              👤 {m.nome}
                                              {m.whatsapp&&<> · 📱 {m.whatsapp}</>}
                                              {m.email&&<> · ✉️ {m.email}</>}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {Object.keys(admins).length===0&&(
                  <div style={{textAlign:"center",padding:"40px",fontFamily:"sans-serif",color:"#555"}}>Nenhum administrador cadastrado ainda.</div>
                )}
              </div>
            )}

            {/* ABA PARTICIPANTES — base completa */}
            {abaM==="participantes"&&(
              <div>
                <div style={{fontFamily:"sans-serif",fontSize:12,color:"#888",marginBottom:16,lineHeight:1.8}}>
                  Base completa de todos os participantes cadastrados em todos os bolões de todos os administradores.
                </div>
                {Object.entries(admins).map(([slug,a])=>{
                  const seusBolaoes = Object.entries(allBoloes).filter(([,b])=>b.adminSlug===slug);
                  if(seusBolaoes.length===0) return null;
                  return(
                    <div key={slug} style={{background:"rgba(255,255,255,.03)",border:"1px solid #1a3a1a",borderRadius:12,marginBottom:16,overflow:"hidden"}}>
                      <div style={{background:"linear-gradient(90deg,#004d22,#009c3b)",padding:"10px 16px"}}>
                        <div style={{fontSize:16,letterSpacing:2}}>{a.nome}</div>
                        <div style={{fontFamily:"sans-serif",fontSize:11,color:"rgba(255,255,255,.7)"}}>/{slug}</div>
                      </div>
                      {seusBolaoes.map(([bid,b])=>{
                        const aprov = Object.entries(members[bid]||{}).filter(([,m])=>m.status==="aprovado").map(([uid,m])=>({uid,...m}));
                        return(
                          <div key={bid} style={{padding:"12px 16px",borderBottom:"1px solid #0a1a0a"}}>
                            <div style={{fontSize:14,color:"#ffdf00",letterSpacing:2,marginBottom:8}}>⚽ {b.nome} ({aprov.length})</div>
                            {aprov.length===0?(
                              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#555"}}>Nenhum participante.</div>
                            ):(
                              <div style={{overflowX:"auto"}}>
                                <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"sans-serif",fontSize:12}}>
                                  <thead>
                                    <tr style={{borderBottom:"1px solid #1a2a1a"}}>
                                      {["Apelido","Nome","WhatsApp","Email"].map(h=>(
                                        <th key={h} style={{textAlign:"left",padding:"6px 10px",color:"#888",fontWeight:700}}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {aprov.map(m=>(
                                      <tr key={m.uid} style={{borderBottom:"1px solid #0a0a0a"}}>
                                        <td style={{padding:"6px 10px",color:"#fff",fontWeight:700}}>{m.apelido}</td>
                                        <td style={{padding:"6px 10px",color:"#aaa"}}>{m.nome}</td>
                                        <td style={{padding:"6px 10px",color:"#25d366"}}>{m.whatsapp||"—"}</td>
                                        <td style={{padding:"6px 10px",color:"#aaa"}}>{m.email||"—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ABA LEADS */}
            {abaM==="leads"&&(
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  flexWrap:"wrap",gap:12,marginBottom:16}}>
                  <div>
                    <div style={{fontSize:18,letterSpacing:3,color:"#ffdf00"}}>📋 BASE DE LEADS</div>
                    <div style={{fontFamily:"sans-serif",fontSize:12,color:"#666",marginTop:4}}>
                      {Object.keys(leads).length} cadastros realizados
                    </div>
                  </div>
                  <button onClick={()=>{
                    const rows = [["Nome","WhatsApp","Email","Profissão","Nome do Bolão","Link","Plano","Origem","Data"]];
                    Object.values(leads).forEach(l=>{
                      rows.push([l.nome||"",l.whatsapp||"",l.email||"",l.profissao||"",
                        l.nomeBolao||"",l.slug||"",l.plano||"",l.origem||"",
                        l.criadoEm?new Date(l.criadoEm).toLocaleString("pt-BR"):"",
                      ]);
                    });
                    const sep = ",";
                    const nl = String.fromCharCode(10);
                    const q = (c) => '"' + String(c).replace(/"/g, '""') + '"';
                    const csv = rows.map(r=>r.map(q).join(sep)).join(nl);
                    const blob = new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href=url;
                    a.download="leads_bolao_"+new Date().toISOString().slice(0,10)+".csv";
                    a.click(); URL.revokeObjectURL(url);
                  }} style={{background:"linear-gradient(135deg,#009c3b,#006622)",color:"#fff",
                    border:"none",borderRadius:10,padding:"10px 20px",cursor:"pointer",
                    fontFamily:"sans-serif",fontSize:13,fontWeight:700,letterSpacing:1}}>
                    ⬇️ Exportar CSV
                  </button>
                </div>
                {Object.keys(leads).length===0?(
                  <div style={{textAlign:"center",padding:"40px",fontFamily:"sans-serif",color:"#555"}}>
                    Nenhum lead ainda. Os cadastros aparecerão aqui automaticamente.
                  </div>
                ):(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"sans-serif",fontSize:12}}>
                      <thead>
                        <tr style={{borderBottom:"2px solid #1a3a1a",background:"rgba(0,156,59,.08)"}}>
                          {["Nome","WhatsApp","Email","Profissão","Bolão","Link","Plano","Data"].map(h=>(
                            <th key={h} style={{textAlign:"left",padding:"10px 12px",color:"#ffdf00",
                              fontWeight:700,whiteSpace:"nowrap",fontSize:11,letterSpacing:1}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(leads).sort((a,b)=>(b[1].criadoEm||"").localeCompare(a[1].criadoEm||"")).map(([slug,l])=>(
                          <tr key={slug} style={{borderBottom:"1px solid #0d1a0d"}}>
                            <td style={{padding:"10px 12px",color:"#fff",fontWeight:600}}>{l.nome||"—"}</td>
                            <td style={{padding:"10px 12px"}}>
                              <a href={"https://wa.me/"+(l.whatsapp||"").replace(/[^0-9]/g,"")}
                                target="_blank" rel="noopener noreferrer"
                                style={{color:"#25d366",textDecoration:"none",fontWeight:600}}>
                                {l.whatsapp||"—"}
                              </a>
                            </td>
                            <td style={{padding:"10px 12px",color:"#aaa"}}>{l.email||"—"}</td>
                            <td style={{padding:"10px 12px",color:"#888"}}>{l.profissao||"—"}</td>
                            <td style={{padding:"10px 12px",color:"#ffdf00"}}>{l.nomeBolao||"—"}</td>
                            <td style={{padding:"10px 12px"}}>
                              <a href={"/"+slug} target="_blank" rel="noopener noreferrer"
                                style={{color:"#009c3b",textDecoration:"none",fontSize:11}}>
                                /{slug}
                              </a>
                            </td>
                            <td style={{padding:"10px 12px"}}>
                              <span style={{background:l.plano==="gratis"?"rgba(80,80,80,.3)":
                                l.plano==="pro"?"rgba(0,156,59,.3)":"rgba(200,162,0,.3)",
                                color:l.plano==="gratis"?"#888":l.plano==="pro"?"#009c3b":"#c8a200",
                                border:"1px solid "+(l.plano==="gratis"?"#333":l.plano==="pro"?"#009c3b":"#c8a200"),
                                borderRadius:100,padding:"2px 10px",fontSize:11,fontWeight:700}}>
                                {l.plano==="gratis"?"🆓 Grátis":l.plano==="pro"?"⚡ Pro":"👑 Premium"}
                              </span>
                            </td>
                            <td style={{padding:"10px 12px",color:"#555",fontSize:11,whiteSpace:"nowrap"}}>
                              {l.criadoEm?new Date(l.criadoEm).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}):"—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ABA LICENÇAS */}
            {abaM==="licencas"&&(
              <div>
                <div style={{background:"rgba(200,162,0,.08)",border:"1px solid rgba(200,162,0,.3)",borderRadius:12,padding:"16px",marginBottom:16}}>
                  <div style={{fontSize:16,letterSpacing:3,color:"#c8a200",marginBottom:10}}>🔑 GERAR NOVAS LICENÇAS</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                    <input placeholder="Nome do cliente (opcional)" value={newLicName} onChange={e=>setNewLicName(e.target.value)}
                      style={{flex:1,minWidth:160,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"sans-serif"}}/>
                    <select value={newLicPlano} onChange={e=>setNewLicPlano(e.target.value)}
                      style={{background:"#050d0a",color:"#ffdf00",border:"1px solid #c8a200",borderRadius:8,padding:"9px 12px",fontSize:14,cursor:"pointer"}}>
                      <option value="pro">⚡ Pro (1 bolão · 50 pessoas)</option>
                      <option value="premium">👑 Premium (3 bolões · 50 pessoas)</option>
                    </select>
                    <input type="number" min="1" max="20" value={newLicQtd} onChange={e=>setNewLicQtd(parseInt(e.target.value)||1)}
                      style={{width:60,background:"#050d0a",color:"#fff",border:"1px solid #333",borderRadius:8,padding:"9px",fontSize:14,fontFamily:"sans-serif",textAlign:"center"}}/>
                    <button onClick={gerarLicencas}
                      style={{background:"linear-gradient(135deg,#c8a200,#8b7000)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",cursor:"pointer",fontSize:14,fontWeight:700}}>
                      🔑 Gerar
                    </button>
                  </div>
                </div>
                <div style={{display:"grid",gap:8}}>
                  {Object.entries(licencas).sort((a,b)=>b[1].criadoEm?.localeCompare(a[1].criadoEm||"")||0).map(([id,l])=>(
                    <div key={id} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${l.usado?"#1a2a1a":"rgba(200,162,0,.3)"}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <span style={{fontFamily:"monospace",fontSize:16,color:l.usado?"#555":"#ffdf00",fontWeight:700,letterSpacing:2}}>{l.codigo}</span>
                          <span style={{fontFamily:"sans-serif",fontSize:11,background:l.usado?"#1a1a1a":"rgba(200,162,0,.2)",color:l.usado?"#555":"#c8a200",padding:"2px 8px",borderRadius:20}}>
                            {l.usado?"✅ Usado":"🟡 Disponível"}
                          </span>
                        </div>
                        <div style={{fontFamily:"sans-serif",fontSize:11,color:"#666",marginTop:2}}>
                          {l.nome&&<span>👤 {l.nome} · </span>}
                          📅 {new Date(l.criadoEm).toLocaleDateString("pt-BR")}
                          {l.usado&&l.adminSlug&&<span> · 🔗 /{l.adminSlug}</span>}
                        </div>
                      </div>
                      {!l.usado&&(
                        <button onClick={()=>{navigator.clipboard?.writeText(l.codigo);notify("Código copiado!");}}
                          style={{background:"rgba(200,162,0,.2)",color:"#c8a200",border:"1px solid rgba(200,162,0,.3)",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",fontWeight:700}}>
                          📋 Copiar
                        </button>
                      )}
                    </div>
                  ))}
                  {Object.keys(licencas).length===0&&(
                    <div style={{textAlign:"center",padding:"30px",fontFamily:"sans-serif",color:"#555"}}>Nenhuma licença gerada ainda.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <BrStripe/>
    </div>
  );
}
