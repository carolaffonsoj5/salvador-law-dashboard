'use client';
import { useState, useCallback, useRef, useEffect } from "react";

const EMPRESA = {
  nome: "Salvador Law PA",
  segmento: "Escritório de Advocacia — Direito de Imigração",
  icon: "⚖️",
  cor: "#071525", cor2: "#0D2137",
  accent: "#1E6FBF", accent2: "#4DA3FF",
  gold: "#C9A84C",
  danger: "#E05252", warning: "#E09B2A", success: "#2ECC8F",
};

const USUARIOS = {
  larissa: { senha: "law123", papel: "dono", nome: "Larissa Salvador" },
  assistente: { senha: "law123", papel: "funcionario", nome: "Assistente" },
};

const DADOS_REAIS = {
  semana: "13/04/2026", fonte: "excel",
  leads: { total: 946, convertidos: 159, taxa: 16.8, contacting: 18, open: 31, semStatus: 738, meta: 30 },
  contratos: { totalHistorico: 620, pendentes: 21, valorPendente: 56550, naoVisualizaram: 9, visualizaramNaoAssinaram: 12 },
  historico: [
    { mes: "Out/25", enviados: 23, assinados: 17, expirados: 5, taxa: 73.9, valor: 37900 },
    { mes: "Nov/25", enviados: 11, assinados: 10, expirados: 1, taxa: 90.9, valor: 26750 },
    { mes: "Dez/25", enviados: 11, assinados: 8,  expirados: 2, taxa: 72.7, valor: 15500 },
    { mes: "Jan/26", enviados: 15, assinados: 11, expirados: 4, taxa: 73.3, valor: 24750 },
    { mes: "Fev/26", enviados: 12, assinados: 9,  expirados: 0, taxa: 75.0, valor: 13250 },
    { mes: "Mar/26", enviados: 9,  assinados: 6,  expirados: 0, taxa: 66.7, valor: 10250 },
  ],
  contratosPendentes: [
    { doc: "EB-1A Retainer - Monique Natali", data: "2023-06-22", valor: 12000, tipo: "nao_viu" },
    { doc: "EB-1A (I-140 Only) Retainer", data: "2023-06-22", valor: 12000, tipo: "viu" },
    { doc: "L1A Visa - Gabriel Hasse de Souza", data: "2025-10-03", valor: 10000, tipo: "nao_viu" },
    { doc: "AOS Marriage - Fulvio Rocha & Mariannette", data: "2025-12-08", valor: 4000, tipo: "viu" },
    { doc: "National Visa Center - Leonardo Rosa", data: "2024-11-27", valor: 2500, tipo: "viu" },
    { doc: "Expedite Request - Felipe Guia", data: "2025-04-16", valor: 2000, tipo: "nao_viu" },
    { doc: "Jorge Jose da Silva RFE", data: "2023-08-28", valor: 1500, tipo: "viu" },
    { doc: "Court Attendance - Wesley Siqueira", data: "2025-06-26", valor: 1500, tipo: "nao_viu" },
    { doc: "Familiar Plan - Cindy Banegas Alvarenga", data: "2025-09-09", valor: 1500, tipo: "viu" },
    { doc: "CONTINUANCE EM COURT - Wanderson Martins", data: "2026-02-10", valor: 1500, tipo: "viu" },
    { doc: "Court Attendance - Luan Henrique Maia", data: "2026-02-23", valor: 1500, tipo: "viu" },
    { doc: "Familiar Plan - Thais Virtuoso", data: "2026-02-09", valor: 1500, tipo: "viu" },
    { doc: "Court Attendance - Marilia da Silva", data: "2026-03-27", valor: 1500, tipo: "viu" },
    { doc: "Nunc Pro Tunc - Jazmin Hamuy Jara", data: "2024-05-22", valor: 1000, tipo: "viu" },
    { doc: "Interview Attendance - Alessandra Procopio", data: "2025-07-23", valor: 750, tipo: "nao_viu" },
    { doc: "Interview - Valber Fernandes & Alessandra", data: "2026-03-24", valor: 750, tipo: "viu" },
    { doc: "Prenuptial - Iaci Amanda N Lemos", data: "2026-03-26", valor: 750, tipo: "viu" },
    { doc: "CP Family Based - Vernon Sarjeant", data: "2024-10-16", valor: 0, tipo: "viu" },
    { doc: "Adendum - Danuza Corumba", data: "2024-01-24", valor: 100, tipo: "nao_viu" },
    { doc: "Adendum - Juliana Irizarry", data: "2024-01-25", valor: 100, tipo: "viu" },
    { doc: "Adendum - Alexandro Gaete dos Santos", data: "2024-02-13", valor: 100, tipo: "nao_viu" },
  ],
  kpisAdvogada: [
    { kpi: "Casos com estratégia definida e registrada no DW", meta: "100%" },
    { kpi: "Casos aprovados para envio pela advogada", meta: "100%" },
    { kpi: "Revisões finais realizadas antes de cada submissão", meta: "100%" },
    { kpi: "Consultas com estratégia documentada", meta: "100%" },
    { kpi: "RFE/NOID com resposta iniciada no mesmo dia", meta: "100%" },
    { kpi: "Casos EOIR com motions revisadas e assinadas", meta: "100%" },
    { kpi: "Vezes que foi acionada para tarefas operacionais", meta: "0" },
  ],
  kpisEquipe: [
    { kpi: "Clientes sem resposta há +24h", meta: "0", alerta: true },
    { kpi: "Clientes sem contato há +14 dias", meta: "0", alerta: true },
    { kpi: "Casos sem movimentação nos últimos 7d", meta: "0" },
    { kpi: "Tasks atrasadas (vencidas)", meta: "0" },
    { kpi: "Tasks sem responsável", meta: "0" },
    { kpi: "Matters sem time entry esta semana", meta: "0" },
    { kpi: "Dúvidas jurídicas respondidas sem escalar", meta: "0", alerta: true },
  ],
};

const fmt = (v) => `$${(v||0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : fmt(v);
const parseMoney = (s) => parseFloat((s||"0").replace(/[^0-9.]/g,""))||0;

const parseCSVLine = (line) => {
  const result=[]; let cur="", inQuote=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){if(inQuote&&line[i+1]==='"'){cur+='"';i++;}else{inQuote=!inQuote;}}
    else if(ch===','&&!inQuote){result.push(cur.trim());cur="";}
    else{cur+=ch;}
  }
  result.push(cur.trim());
  return result;
};

const parseCSV = (text) => {
  const lines=text.trim().replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n");
  if(lines.length<2)return null;
  const headers=parseCSVLine(lines[0]).map(h=>h.toLowerCase().trim());
  return lines.slice(1).filter(l=>l.trim()).map(line=>{
    const vals=parseCSVLine(line); const obj={};
    headers.forEach((h,i)=>{obj[h]=(vals[i]||"").trim();});
    return obj;
  });
};

// ── ICS PARSER (Google Calendar) ─────────────────────────────
const parseICS = (text) => {
  const eventos = [];
  const blocos = text.split("BEGIN:VEVENT");
  blocos.slice(1).forEach(bloco => {
    const get = (key) => {
      const match = bloco.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return match ? match[1].trim() : "";
    };
    const titulo = get("SUMMARY");
    const inicio = get("DTSTART");
    const fim = get("DTEND");
    const descricao = get("DESCRIPTION");
    const local = get("LOCATION");

    if (!titulo) return;

    // Parsear data
    const parseDt = (dt) => {
      if (!dt) return null;
      const d = dt.replace(/[TZ]/g, "").replace(/[^0-9]/g, "");
      if (d.length < 8) return null;
      return new Date(
        parseInt(d.slice(0,4)),
        parseInt(d.slice(4,6))-1,
        parseInt(d.slice(6,8)),
        d.length > 8 ? parseInt(d.slice(8,10)) : 0,
        d.length > 10 ? parseInt(d.slice(10,12)) : 0
      );
    };

    const dataInicio = parseDt(inicio);
    const dataFim = parseDt(fim);

    eventos.push({
      titulo,
      dataInicio,
      dataFim,
      descricao: descricao.replace(/\n/g, " ").slice(0, 120),
      local,
      dataStr: dataInicio ? dataInicio.toLocaleDateString("pt-BR") : "",
      horaStr: dataInicio ? dataInicio.toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"}) : "",
    });
  });

  // Ordenar por data
  eventos.sort((a, b) => (a.dataInicio || 0) - (b.dataInicio || 0));

  // Filtrar próximos 30 dias
  const hoje = new Date();
  const em30 = new Date(); em30.setDate(hoje.getDate() + 30);
  const proximos = eventos.filter(e => e.dataInicio && e.dataInicio >= hoje && e.dataInicio <= em30);
  const passados = eventos.filter(e => e.dataInicio && e.dataInicio < hoje).slice(-5);

  return { agenda: proximos, agendaPassada: passados, totalEventos: eventos.length };
};

// ── PARSER XLSX SALVADOR LAW ─────────────────────────────────
// Lê o Excel de KPIs diretamente (SheetJS já converte para rows)
const processarExcelSalvadorLaw = (rows) => {
  // Detecta se é o Excel da Salvador Law pela primeira célula
  const primeiraLinha = rows[0] ? Object.values(rows[0]).join(" ") : "";
  if (!primeiraLinha.includes("SALVADOR LAW") && !primeiraLinha.includes("KPI")) return null;

  const kpisAdv = [], kpisEq = [];
  let leads = null, contratos = null;
  const historico = [];

  rows.forEach(row => {
    const vals = Object.values(row).map(v => String(v || "").trim());
    const kpi = vals[0];
    const meta = vals[1] || vals[2] || "";
    const resultado = vals[2] || vals[3] || "";
    const status = vals[3] || vals[4] || "";

    if (!kpi || kpi.startsWith("KPI") || kpi.startsWith("🔑 ") || kpi.startsWith("🔵 ") || kpi.startsWith("🟢 ") || kpi.startsWith("📋") || kpi.startsWith("✅") || kpi.startsWith("⚖️") || kpi.startsWith("⏱️") || kpi.startsWith("☀️") || kpi.startsWith("PAINEL") || kpi.startsWith("Estes") || kpi.startsWith("⚠️") || kpi.startsWith("──")) return;

    // Leads
    if (kpi.includes("Total de leads")) leads = { ...leads, total: parseInt(resultado) || 946 };
    if (kpi.includes("convertidos em clientes")) leads = { ...leads, convertidos: parseInt(resultado) || 159 };
    if (kpi.includes("Taxa de convers")) leads = { ...leads, taxa: parseFloat(String(resultado).replace("%","")) || 16.8 };
    if (kpi.includes("Contacting")) leads = { ...leads, contacting: parseInt(resultado) || 18 };
    if (kpi.includes("Open")) leads = { ...leads, open: parseInt(resultado) || 31 };

    // KPIs da advogada (meta é %, responsável tem 🔑)
    const resp = vals[1] || "";
    if (resp.includes("Advogada") || resp.includes("🔑")) {
      const val = resultado && !resultado.includes("Preencher") ? resultado : null;
      const st = status.includes("🔴") ? "danger" : status.includes("🟢") ? "ok" : "verificar";
      kpisAdv.push({ kpi, meta: meta.replace("🔑 Advogada","").trim()||meta, resultado: val, status: st });
    }
    // KPIs da equipe
    else if (resp.includes("Paralegal") || resp.includes("equipe") || resp.includes("🔵") || resp.includes("Toda")) {
      const val = resultado && !resultado.includes("Preencher") ? resultado : null;
      const st = status.includes("🔴") ? "danger" : status.includes("🟢") ? "ok" : "verificar";
      kpisEq.push({ kpi, meta: meta.replace("🔵 Paralegal","").replace("🔵 Toda equipe","").trim()||meta, resultado: val, status: st });
    }

    // Histórico mensal (formato: Jan/23, Fev/23...)
    if (/^[A-Za-zÀ-ú]{3}\/\d{2}$/.test(kpi)) {
      historico.push({
        mes: kpi,
        enviados: parseInt(meta) || 0,
        assinados: parseInt(resultado) || 0,
        expirados: parseInt(status) || 0,
        taxa: parseFloat(String(vals[4]||"0").replace("%","")) || 0,
        valor: parseFloat(String(vals[5]||"0").replace(/[^0-9.]/g,"")) || 0,
      });
    }
  });

  const resultado = {};
  if (leads) resultado.leadsAtualizados = { ...{ total:946, convertidos:159, taxa:16.8, contacting:18, open:31, semStatus:738, meta:30 }, ...leads };
  if (kpisAdv.length > 0) resultado.kpisAdvAtualizado = kpisAdv;
  if (kpisEq.length > 0) resultado.kpisEqAtualizado = kpisEq;
  if (historico.length > 0) resultado.historicoAtualizado = historico.slice(-6);
  resultado._isSalvadorLaw = true;
  return Object.keys(resultado).length > 1 ? resultado : null;
};

// ── PARSER LEADS (Docketwise) ────────────────────────────────
// Colunas: full_name, lead_status, matters, email, ...
const processarLeadsCSV = (rows) => {
  let total=0, convertidos=0, contacting=0, open=0, semStatus=0;
  rows.forEach(r => {
    const status = (r['lead_status'] || r['status'] || '').trim();
    const matters = (r['matters'] || '').trim();
    total++;
    if (status === 'Contacting') contacting++;
    else if (status === 'Open') open++;
    else if (!status || status === 'Unspecified') semStatus++;
    // Convertido = tem matter associado
    if (matters && matters !== 'Unspecified' && matters !== '') convertidos++;
  });
  const taxa = total > 0 ? parseFloat(((convertidos/total)*100).toFixed(1)) : 0;
  return {
    leadsAtualizados: { total, convertidos, taxa, contacting, open, semStatus, meta: 30 },
    _isLeads: true,
  };
};

// ── PARSER PANDADOC ───────────────────────────────────────────
// Colunas: Document Name, Document Status, Total, Sent Date, Completed Date, Viewed Date...
const processarPandaDoc = (rows) => {
  let enviados=0, completados=0, expirados=0, declinados=0, draft=0;
  let valorTotal=0, valorPendente=0;
  const pendentes = [];
  const mensal = {};

  rows.forEach(r => {
    const status = (r['Document Status'] || r['document status'] || '').trim();
    const nome = (r['Document Name'] || r['document name'] || '').trim();
    const total = parseFloat(r['Total'] || r['total'] || '0') || 0;
    const criadoStr = (r['Created Date (UTC+0)'] || r['created date'] || '').slice(0,7);

    enviados++;
    valorTotal += total;

    if (status === 'document.completed') { completados++; }
    else if (status === 'document.expired') { expirados++; }
    else if (status === 'document.declined') { declinados++; }
    else if (status === 'document.draft') { draft++; }
    else if (status === 'document.sent' || status === 'document.viewed') {
      valorPendente += total;
      const tipo = status === 'document.viewed' ? 'viu' : 'nao_viu';
      const data = (r['Sent Date (UTC+0)'] || r['Created Date (UTC+0)'] || '').slice(0,10);
      if (nome) pendentes.push({ doc: nome, valor: total, tipo, data });
    }

    // Histórico mensal
    if (criadoStr && criadoStr.length === 7) {
      const [ano, mes] = criadoStr.split('-');
      const mesesPT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const mesLabel = `${mesesPT[parseInt(mes)-1]}/${ano.slice(2)}`;
      if (!mensal[mesLabel]) mensal[mesLabel] = { mes: mesLabel, enviados:0, assinados:0, expirados:0, valor:0, _ordem: parseInt(ano)*100+parseInt(mes) };
      mensal[mesLabel].enviados++;
      if (status === 'document.completed') { mensal[mesLabel].assinados++; mensal[mesLabel].valor += total; }
      if (status === 'document.expired') mensal[mesLabel].expirados++;
    }
  });

  // Ordenar e pegar últimos 6 meses
  const historicoOrdenado = Object.values(mensal)
    .sort((a,b) => a._ordem - b._ordem)
    .map(h => ({ ...h, taxa: h.enviados > 0 ? parseFloat(((h.assinados/h.enviados)*100).toFixed(1)) : 0 }));
  const historico6 = historicoOrdenado.slice(-6);

  // Ordenar pendentes por valor desc
  pendentes.sort((a,b) => b.valor - a.valor);

  return {
    historicoAtualizado: historico6,
    contratosPendentesReal: pendentes,
    contratosStats: {
      totalHistorico: enviados,
      pendentes: pendentes.length,
      valorPendente,
      naoVisualizaram: pendentes.filter(p=>p.tipo==='nao_viu').length,
      visualizaramNaoAssinaram: pendentes.filter(p=>p.tipo==='viu').length,
      completados, expirados, declinados, draft,
    },
    _isPandaDoc: true,
  };
};

const processarRelatorio = (rows) => {
  if(!rows||rows.length===0)return null;
  const keys=Object.keys(rows[0]).map(k=>k.toLowerCase());
  const has=(k)=>keys.some(key=>key.includes(k));

  // Leads do Docketwise
  if(has("full_name")||has("lead_status")||(has("lead")&&has("status")))return processarLeadsCSV(rows);

  // PandaDoc
  if(has("document status")||has("document name")||(has("pandadoc")))return processarPandaDoc(rows);

  // HouseCall Pro
  if(has("customer name")||(has("customer")&&has("paid amount")))return processarClientes(rows);
  if(has("employee"))return processarEquipe(rows);
  return null;
};

const processarClientes = (rows) => {
  const pendentes=[]; let fatTotal=0, pagoTotal=0, clientesAtivos=0;
  rows.forEach(r=>{
    const nome=r["customer name"]||"";
    if(!nome||nome.toLowerCase()==="total")return;
    const revenue=parseMoney(r["job revenue"]);
    const pago=parseMoney(r["paid amount"]);
    fatTotal+=revenue; pagoTotal+=pago; clientesAtivos++;
    if(revenue-pago>0.01)pendentes.push({doc:nome,valor:revenue-pago,tipo:"viu",data:""});
  });
  return { faturamento:{total:fatTotal,recebido:pagoTotal,pendente:fatTotal-pagoTotal}, clientesPendentes:pendentes, clientes:{ativos:clientesAtivos} };
};

const processarEquipe = (rows) => {
  const equipe=[];
  rows.forEach(r=>{
    const nome=r["employee"]||"";
    if(!nome||nome.toLowerCase()==="total")return;
    equipe.push({nome, casos:parseInt(r["job count"]||"0")||0, faturado:parseMoney(r["job revenue"]), horas:parseFloat(r["total on job hrs"]||"0")||0});
  });
  return { equipe };
};

const Card = ({children,style})=>(
  <div style={{background:"linear-gradient(135deg,#0D1E30,#091828)",borderRadius:14,padding:"18px 20px",border:"1px solid #1A3050",boxShadow:"0 4px 24px rgba(0,0,0,0.3)",...style}}>{children}</div>
);

const Metric = ({icon,label,value,sub,color,big})=>(
  <Card>
    <div style={{fontSize:10,color:"#4A6A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{icon} {label}</div>
    <div style={{fontSize:big?20:18,fontWeight:900,color:color||"#E8F0F8",fontFamily:"'Georgia',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#4A6080",marginTop:5}}>{sub}</div>}
  </Card>
);

const Badge = ({text,color})=>(
  <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:(color||"#888")+"18",color:color||"#888",border:`1px solid ${(color||"#888")}33`}}>{text}</span>
);

const Ring = ({value,size=60,color})=>{
  const r=(size-6)/2,circ=2*Math.PI*r,off=circ-(value/100)*circ;
  return(
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1A3050" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset .8s ease"}}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" style={{transform:"rotate(90deg)",transformOrigin:"center",fontSize:12,fontWeight:800,fill:color}}>{value}%</text>
    </svg>
  );
};

const MiniBar = ({data,colorFn,height=90})=>{
  const max=Math.max(...data.map(d=>d.val),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height}}>
      {data.map((d,i)=>{
        const color=colorFn?colorFn(d):EMPRESA.accent;
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{fontSize:7,color:"#5A7A9A",fontWeight:700}}>{d.val>=1000?fmtK(d.val):d.val}</div>
            <div style={{width:"100%",borderRadius:3,height:`${Math.max((d.val/max)*(height-28),2)}px`,background:`linear-gradient(180deg,${color},${color}55)`,transition:"height .6s ease"}}/>
            <div style={{fontSize:7,color:"#3A5A7A",textAlign:"center",lineHeight:1.2}}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const Section = ({icon,title,count,badge,children})=>(
  <div style={{marginTop:26}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
      <span style={{fontSize:16}}>{icon}</span>
      <span style={{fontSize:14,fontWeight:800,color:"#C8D8E8",fontFamily:"'Georgia',serif"}}>{title}</span>
      {count!=null&&<span style={{fontSize:10,color:"#4A6A8A",background:"#0D2040",padding:"2px 10px",borderRadius:20,fontWeight:700,border:"1px solid #1A3050"}}>{count}</span>}
      {badge&&badge}
    </div>
    {children}
  </div>
);

// Carrega SheetJS dinamicamente para ler XLSX
const loadSheetJS = () => new Promise((resolve, reject) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  script.onload = () => resolve(window.XLSX);
  script.onerror = reject;
  document.head.appendChild(script);
});

const parseXLSX = async (file) => {
  const XLSX = await loadSheetJS();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
  // Normaliza chaves para lowercase
  return json.map(row => {
    const obj = {};
    Object.keys(row).forEach(k => { obj[k.toLowerCase().trim()] = String(row[k] || '').trim(); });
    return obj;
  });
};

const DropZone = ({onExtras,extras})=>{
  const [drag,setDrag]=useState(false);
  const [loading,setLoading]=useState(false);
  const [files,setFiles]=useState([]);
  const [error,setError]=useState("");
  const fileRef=useRef();

  const handleFiles=async(fileList)=>{
    setError(""); setLoading(true);
    const newFiles=[];
    for(const file of fileList){
      const ext=file.name.split(".").pop().toLowerCase();
      try{
        if(ext==="csv"||ext==="txt"){
          const text=await file.text();
          const rows=parseCSV(text);
          if(rows){const partial=processarRelatorio(rows);
            if(partial)newFiles.push({name:file.name,rows:rows.length,data:partial});
            else setError(`Formato não reconhecido: ${file.name}`);
          }
        }else if(ext==="xlsx"||ext==="xls"){
          const rows=await parseXLSX(file);
          if(rows&&rows.length>0){
            // Tenta parser específico do Excel da Salvador Law primeiro
            const salvadorData=processarExcelSalvadorLaw(rows);
            if(salvadorData){
              newFiles.push({name:file.name,rows:rows.length,data:salvadorData,note:"✅ Excel KPIs detectado"});
            } else {
              const partial=processarRelatorio(rows);
              if(partial)newFiles.push({name:file.name,rows:rows.length,data:partial});
              else newFiles.push({name:file.name,rows:rows.length,data:null,note:"Excel lido — formato não mapeado"});
            }
          }
        }else if(ext==="ics"){
          const text=await file.text();
          const agendaData=parseICS(text);
          if(agendaData&&agendaData.totalEventos>0){
            newFiles.push({name:file.name,rows:agendaData.totalEventos,data:{agenda:agendaData}});
          }else{
            newFiles.push({name:file.name,rows:"—",data:null,note:"Nenhum evento encontrado no .ics"});
          }
        }else if(ext==="pdf"){
          newFiles.push({name:file.name,rows:"—",data:null,note:"PDF: exporte como ICS pelo Google Calendar"});
        }else{
          newFiles.push({name:file.name,rows:"—",data:null,note:`Formato .${ext} não suportado — use CSV ou XLSX`});
        }
      }catch(e){setError(`Erro ao ler ${file.name}: ${e.message}`);}
    }
    setFiles(prev=>[...prev,...newFiles]);
    const allPartials=[...files,...newFiles].filter(f=>f.data).map(f=>f.data);
    if(allPartials.length>0){
      const novo={...extras};
      allPartials.forEach(p=>{
        if(p.faturamento)novo.faturamentoSemana=p.faturamento;
        if(p.equipe)novo.equipe=p.equipe;
        if(p.clientesPendentes)novo.clientesPagPendentes=p.clientesPendentes;
        if(p.agenda)novo.agenda=p.agenda;
        // Dados do Excel de KPIs da Salvador Law
        if(p._isSalvadorLaw){
          if(p.leadsAtualizados)novo.leadsAtualizados=p.leadsAtualizados;
          if(p.kpisAdvAtualizado)novo.kpisAdvAtualizado=p.kpisAdvAtualizado;
          if(p.kpisEqAtualizado)novo.kpisEqAtualizado=p.kpisEqAtualizado;
          if(p.historicoAtualizado)novo.historicoAtualizado=p.historicoAtualizado;
        }
        // Leads do Docketwise
        if(p._isLeads&&p.leadsAtualizados)novo.leadsAtualizados=p.leadsAtualizados;
        // PandaDoc
        if(p._isPandaDoc){
          if(p.historicoAtualizado)novo.historicoAtualizado=p.historicoAtualizado;
          if(p.contratosPendentesReal)novo.contratosPendentesReal=p.contratosPendentesReal;
          if(p.contratosStats)novo.contratosStats=p.contratosStats;
        }
      });
      onExtras(novo);
    }
    setLoading(false);
  };

  const onDrop=useCallback((e)=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);},[files]);

  return(
    <div>
      <div style={{marginBottom:20,padding:"14px 18px",background:"#0A1828",borderRadius:12,border:"1px solid #1A3050"}}>
        <div style={{fontSize:11,color:EMPRESA.gold,fontWeight:700,marginBottom:8}}>✅ Dados do Excel já carregados automaticamente:</div>
        <div style={{fontSize:11,color:"#6A8AAA",lineHeight:2}}>
          📊 946 leads · 159 convertidos (16.8% conversão)<br/>
          📄 21 contratos pendentes · $56,550 em aberto<br/>
          📈 39 meses de histórico (Jan/23 — Mar/26)<br/>
          ✅ KPIs da advogada e equipe prontos para preencher
        </div>
      </div>

      <div style={{fontSize:12,color:"#4A6A8A",fontWeight:700,marginBottom:10}}>📥 Complementar com dados do HouseCall Pro (opcional):</div>
      <div onDrop={onDrop} onDragOver={(e)=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onClick={()=>fileRef.current?.click()}
        style={{border:`2px dashed ${drag?EMPRESA.accent:"#1A3050"}`,borderRadius:14,padding:"28px 20px",textAlign:"center",background:drag?EMPRESA.accent+"08":"#050F1A",cursor:"pointer",transition:"all .3s",marginBottom:14}}>
        <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls,.ics,.pdf" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
        <div style={{fontSize:32,marginBottom:6}}>{loading?"⏳":"📂"}</div>
        <div style={{fontSize:13,fontWeight:700,color:"#6A8AAA"}}>{loading?"Processando...":"Arraste CSV, XLSX ou .ics aqui"}</div>
        <div style={{fontSize:11,color:"#3A5A7A",marginTop:4}}>CSV · Excel (.xlsx) · Google Calendar (.ics)</div>
      </div>

      {error&&<div style={{padding:"10px 14px",background:EMPRESA.danger+"12",border:`1px solid ${EMPRESA.danger}33`,borderRadius:10,fontSize:12,color:EMPRESA.danger,marginBottom:10}}>⚠️ {error}</div>}

      {files.map((f,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#0D1E30",borderRadius:8,marginBottom:4,border:"1px solid #1A3050"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span>{f.data?"✅":"📎"}</span>
            <span style={{fontSize:12,color:"#C8D8E8",fontWeight:600}}>{f.name}</span>
          </div>
          {f.note?<span style={{fontSize:10,color:EMPRESA.warning}}>{f.note}</span>:f.data&&<Badge text="Processado ✓" color={EMPRESA.success}/>}
        </div>
      ))}
    </div>
  );
};

const VisaoDono = ({dados,extras})=>{
  const [aba,setAba]=useState("resumo");
  const d=dados;
  // Usa dados atualizados se disponível
  const leads = extras.leadsAtualizados || d.leads;
  const kpisAdv = extras.kpisAdvAtualizado || d.kpisAdvogada;
  const kpisEq = extras.kpisEqAtualizado || d.kpisEquipe;
  const historico = extras.historicoAtualizado || d.historico;
  const contratos = extras.contratosStats || d.contratos;
  const contratosPendentes = extras.contratosPendentesReal || d.contratosPendentes;
  const taxaConv=leads.taxa;
  const ultimoMes=historico[historico.length-1];
  const fat=extras.faturamentoSemana;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:10,color:"#3A5A7A",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5}}>Atualizado em</div>
          <div style={{fontSize:20,fontWeight:900,color:"#E8F0F8",fontFamily:"'Georgia',serif"}}>{d.semana}</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Badge text="📊 Dados Excel" color={EMPRESA.gold}/>
          {fat&&<Badge text="+ HouseCall" color={EMPRESA.success}/>}
        </div>
      </div>

      <div style={{display:"flex",gap:3,padding:4,background:"#0A1828",borderRadius:12,marginBottom:20,border:"1px solid #1A3050",overflowX:"auto"}}>
        {[{id:"resumo",label:"📊 Resumo"},{id:"contratos",label:"📄 Contratos"},{id:"leads",label:"🎯 Leads"},{id:"kpis",label:"✅ KPIs"}].map(a=>(
          <button key={a.id} onClick={()=>setAba(a.id)} style={{flex:1,padding:"9px 6px",borderRadius:9,border:"none",whiteSpace:"nowrap",background:aba===a.id?EMPRESA.accent+"22":"transparent",color:aba===a.id?EMPRESA.accent:"#3A5A7A",fontWeight:800,fontSize:11,cursor:"pointer",borderBottom:aba===a.id?`2px solid ${EMPRESA.accent}`:"2px solid transparent"}}>{a.label}</button>
        ))}
      </div>

      {aba==="resumo"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            <Metric icon="📄" label="Contratos Pendentes" value={`${contratos.pendentes}`} sub={`${fmt(contratos.valorPendente)} em aberto`} color={EMPRESA.warning} big/>
            <Metric icon="🎯" label="Taxa Conversão" value={`${taxaConv}%`} sub={`Meta: ${leads.meta}% · ${leads.convertidos} convertidos`} color={taxaConv>=leads.meta?EMPRESA.success:EMPRESA.danger} big/>
            <Metric icon="👥" label="Total de Leads" value={leads.total.toLocaleString()} sub={`${leads.contacting} contato · ${leads.open} abertos`} color={EMPRESA.accent2}/>
            <Metric icon="📈" label={`Fechamento ${ultimoMes?.mes}`} value={`${ultimoMes?.taxa}%`} sub={`${ultimoMes?.assinados} assinados · ${fmt(ultimoMes?.valor||0)}`} color={ultimoMes?.taxa>=70?EMPRESA.success:EMPRESA.warning}/>
            <Metric icon="💰" label="Histórico Total" value={`$${(historico.reduce((s,h)=>s+h.valor,0)/1000).toFixed(0)}k`} sub={`${contratos.totalHistorico} contratos · 39 meses`} color={EMPRESA.gold}/>
          </div>

          {fat&&(
            <Section icon="💳" title="Faturamento HouseCall — Semana">
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                <Metric icon="💰" label="Total" value={fmt(fat.total)} color={EMPRESA.success}/>
                <Metric icon="✅" label="Recebido" value={fmt(fat.recebido)} color={EMPRESA.accent2}/>
                <Metric icon="⏳" label="Pendente" value={fmt(fat.pendente)} color={EMPRESA.warning}/>
              </div>
            </Section>
          )}

          <Section icon="🔴" title="COBRAR NA REUNIÃO" count={3}>
            <Card style={{borderColor:EMPRESA.danger+"33",background:EMPRESA.danger+"06"}}>
              {[
                {txt:<><strong>738 leads sem status</strong> — qualificar ou arquivar no DW urgente</>},
                {txt:<><strong>Taxa de conversão {taxaConv}%</strong> — meta é {leads.meta}% · revisar qualificação e follow-up</>},
                {txt:<><strong>21 contratos pendentes</strong> · {fmt(contratos.valorPendente)} em aberto — ver aba Contratos</>},
              ].map((item,i,arr)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i<arr.length-1?"1px solid #1A3050":"none"}}>
                  <span style={{flexShrink:0}}>⚠️</span>
                  <span style={{fontSize:13,color:"#D8C8B8",lineHeight:1.5}}>{item.txt}</span>
                </div>
              ))}
            </Card>
          </Section>

          {extras.agenda&&extras.agenda.agenda&&extras.agenda.agenda.length>0&&(
            <Section icon="📅" title="Próximos Eventos" count={extras.agenda.agenda.length}>
              <Card>
                {extras.agenda.agenda.slice(0,5).map((ev,i,arr)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<arr.length-1?"1px solid #1A3050":"none"}}>
                    <div style={{minWidth:44,textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:16,fontWeight:900,color:EMPRESA.accent2}}>{ev.dataStr.split("/")[0]}</div>
                      <div style={{fontSize:9,color:"#3A5A7A"}}>{["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(ev.dataStr.split("/")[1])-1]}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,color:"#E8F0F8",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.titulo}</div>
                      {ev.horaStr!=="00:00"&&<div style={{fontSize:10,color:EMPRESA.gold}}>{ev.horaStr}{ev.local?" · "+ev.local:""}</div>}
                    </div>
                  </div>
                ))}
              </Card>
            </Section>
          )}

          <Section icon="📈" title="Evolução — Últimos 6 Meses">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Card>
                <div style={{fontSize:10,color:"#3A5A7A",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Valor Fechado</div>
                <MiniBar data={historico.map(h=>({val:h.valor,label:h.mes}))} colorFn={()=>EMPRESA.accent}/>
              </Card>
              <Card>
                <div style={{fontSize:10,color:"#3A5A7A",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Taxa de Fechamento %</div>
                <MiniBar data={historico.map(h=>({val:Math.round(h.taxa),label:h.mes}))} colorFn={d=>d.val>=75?EMPRESA.success:d.val>=60?EMPRESA.warning:EMPRESA.danger}/>
              </Card>
            </div>
          </Section>
        </>
      )}

      {aba==="contratos"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            <Metric icon="📄" label="Pendentes" value={contratos.pendentes} sub={fmt(contratos.valorPendente)} color={EMPRESA.warning} big/>
            <Metric icon="👁" label="Viram, não assinaram" value={contratos.visualizaramNaoAssinaram} sub="Ligar imediatamente" color={EMPRESA.danger}/>
            <Metric icon="📤" label="Nem visualizaram" value={contratos.naoVisualizaram} sub="Reenviar e-mail" color={EMPRESA.warning}/>
          </div>

          <Section icon="⚠️" title="Contratos Pendentes — Ação Imediata" count={contratos.pendentes}>
            <Card>
              {contratosPendentes.map((c,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<contratosPendentes.length-1?"1px solid #1A3050":"none",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,color:"#D8E4F0",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.doc}</div>
                    <div style={{fontSize:10,color:"#3A5A7A",marginTop:2}}>{c.tipo==="nao_viu"?"📤 Não visualizou":"👁 Visualizou, não assinou"} · {c.data}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <span style={{fontSize:12,fontWeight:800,color:c.valor>0?EMPRESA.gold:"#4A6A8A"}}>{c.valor>0?fmt(c.valor):"—"}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:c.tipo==="nao_viu"?EMPRESA.warning+"18":EMPRESA.danger+"18",color:c.tipo==="nao_viu"?EMPRESA.warning:EMPRESA.danger,border:`1px solid ${c.tipo==="nao_viu"?EMPRESA.warning:EMPRESA.danger}33`}}>{c.tipo==="nao_viu"?"Reenviar":"Ligar"}</span>
                  </div>
                </div>
              ))}
            </Card>
          </Section>

          <Section icon="📈" title="Histórico — Últimos 6 Meses">
            <Card>
              {historico.map((h,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<historico.length-1?"1px solid #1A3050":"none"}}>
                  <span style={{fontSize:12,color:"#C8D8E8",fontWeight:700,width:55}}>{h.mes}</span>
                  <span style={{fontSize:11,color:"#4A6A8A"}}>{h.enviados} enviados</span>
                  <span style={{fontSize:11,color:EMPRESA.success}}>{h.assinados} assinados</span>
                  <span style={{fontSize:12,fontWeight:700,color:h.taxa>=75?EMPRESA.success:h.taxa>=60?EMPRESA.warning:EMPRESA.danger}}>{h.taxa}%</span>
                  <span style={{fontSize:12,color:EMPRESA.gold,fontWeight:700}}>{fmtK(h.valor)}</span>
                </div>
              ))}
            </Card>
          </Section>
        </>
      )}

      {aba==="leads"&&(
        <>
          <Card style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
              <div>
                <div style={{fontSize:10,color:"#4A6A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>🎯 Taxa de Conversão</div>
                <div style={{fontSize:40,fontWeight:900,color:taxaConv>=leads.meta?EMPRESA.success:EMPRESA.danger,fontFamily:"'Georgia',serif"}}>{taxaConv}%</div>
                <div style={{fontSize:12,color:"#4A6A8A",marginTop:4}}>Meta: {leads.meta}% · {taxaConv<leads.meta?`${(leads.meta-taxaConv).toFixed(1)}pp abaixo`:"✅ Meta atingida"}</div>
              </div>
              <Ring value={Math.round(taxaConv)} size={80} color={taxaConv>=leads.meta?EMPRESA.success:EMPRESA.danger}/>
            </div>
            <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center"}}>
              {[{l:"Total",v:leads.total,c:EMPRESA.accent2},{l:"Convertidos",v:leads.convertidos,c:EMPRESA.success},{l:"Em Contato",v:leads.contacting,c:EMPRESA.warning},{l:"Sem Status",v:leads.semStatus,c:EMPRESA.danger}].map((item,i)=>(
                <div key={i} style={{padding:"10px 6px",background:"#0A1828",borderRadius:10,border:"1px solid #1A3050"}}>
                  <div style={{fontSize:20,fontWeight:900,color:item.c,fontFamily:"'Georgia',serif"}}>{item.v.toLocaleString()}</div>
                  <div style={{fontSize:9,color:"#4A6A8A",marginTop:4}}>{item.l}</div>
                </div>
              ))}
            </div>
          </Card>

          <Section icon="🔴" title="Ações Urgentes — Leads">
            <Card style={{borderColor:EMPRESA.danger+"33",background:EMPRESA.danger+"06"}}>
              {[
                {txt:<><strong>738 leads sem status</strong> — 78% da base · qualificar ou arquivar no DW</>},
                {txt:<><strong>31 leads Open</strong> — qualificar ou arquivar imediatamente</>},
                {txt:<><strong>18 leads em Contacting</strong> — acompanhar conversão semanal</>},
              ].map((item,i,arr)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<arr.length-1?"1px solid #1A3050":"none"}}>
                  <span style={{flexShrink:0}}>⚠️</span>
                  <span style={{fontSize:13,color:"#D8C8B8",lineHeight:1.5}}>{item.txt}</span>
                </div>
              ))}
            </Card>
          </Section>
        </>
      )}

      {aba==="agenda"&&(
        <>
          {extras.agenda&&extras.agenda.agenda&&extras.agenda.agenda.length>0?(
            <>
              <div style={{marginBottom:16,padding:"12px 16px",background:"#0A1828",borderRadius:12,border:"1px solid #1A3050"}}>
                <div style={{fontSize:11,color:EMPRESA.gold,fontWeight:700}}>📅 {extras.agenda.agenda.length} evento(s) nos próximos 30 dias · {extras.agenda.totalEventos} total no calendário</div>
              </div>
              <Section icon="📅" title="Próximos Eventos" count={extras.agenda.agenda.length}>
                <Card>
                  {extras.agenda.agenda.map((ev,i)=>(
                    <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<extras.agenda.agenda.length-1?"1px solid #1A3050":"none"}}>
                      <div style={{minWidth:54,textAlign:"center",flexShrink:0}}>
                        <div style={{fontSize:18,fontWeight:900,color:EMPRESA.accent2,fontFamily:"'Georgia',serif"}}>{ev.dataStr.split("/")[0]}</div>
                        <div style={{fontSize:10,color:"#3A5A7A"}}>{["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(ev.dataStr.split("/")[1])-1]}</div>
                        {ev.horaStr!=="00:00"&&<div style={{fontSize:10,color:EMPRESA.gold,marginTop:2,fontWeight:700}}>{ev.horaStr}</div>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,color:"#E8F0F8",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.titulo}</div>
                        {ev.local&&<div style={{fontSize:11,color:"#4A6A8A",marginTop:3}}>📍 {ev.local}</div>}
                        {ev.descricao&&<div style={{fontSize:11,color:"#5A7A8A",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.descricao}</div>}
                      </div>
                    </div>
                  ))}
                </Card>
              </Section>
            </>
          ):(
            <Card style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:40,marginBottom:12}}>📅</div>
              <div style={{fontSize:15,fontWeight:800,color:"#6A8AAA",fontFamily:"'Georgia',serif",marginBottom:8}}>Agenda não carregada</div>
              <div style={{fontSize:13,color:"#3A5A7A",marginBottom:20}}>Exporte o Google Calendar como .ics e faça upload em "Atualizar Dados"</div>
              <div style={{fontSize:11,color:"#3A5A7A",background:"#0A1828",padding:"12px 16px",borderRadius:10,border:"1px solid #1A3050",textAlign:"left",lineHeight:2}}>
                1. Abra <strong style={{color:EMPRESA.accent}}>calendar.google.com</strong><br/>
                2. Clique em ⚙️ → <strong>Configurações</strong><br/>
                3. Menu lateral → <strong>Importar e exportar</strong><br/>
                4. Clique em <strong>Exportar</strong><br/>
                5. Extraia o .zip e faça upload do .ics aqui
              </div>
            </Card>
          )}
        </>
      )}

      {aba==="kpis"&&(
        <>
          <Section icon="🔑" title="KPIs da Advogada — Larissa" badge={<Badge text="Preencher semanalmente" color={EMPRESA.gold}/>}>
            <Card>
              {kpisAdv.map((k,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<kpisAdv.length-1?"1px solid #1A3050":"none",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:"#C8D8E8"}}>{k.kpi}</div>
                    <div style={{fontSize:10,color:"#3A5A7A",marginTop:2}}>Meta: {k.meta}</div>
                  </div>
                  <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:EMPRESA.warning+"18",color:EMPRESA.warning,border:`1px solid ${EMPRESA.warning}33`,flexShrink:0}}>🟡 Preencher</span>
                </div>
              ))}
            </Card>
          </Section>

          <Section icon="🔵" title="KPIs da Equipe — Operacional" badge={<Badge text="Verificar diariamente" color={EMPRESA.accent}/>}>
            <Card>
              {kpisEq.map((k,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<kpisEq.length-1?"1px solid #1A3050":"none",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:k.alerta?"#E8C8A8":"#C8D8E8"}}>{k.kpi}</div>
                    <div style={{fontSize:10,color:"#3A5A7A",marginTop:2}}>Meta: {k.meta}</div>
                  </div>
                  <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,flexShrink:0,background:k.alerta?EMPRESA.danger+"18":EMPRESA.warning+"18",color:k.alerta?EMPRESA.danger:EMPRESA.warning,border:`1px solid ${k.alerta?EMPRESA.danger:EMPRESA.warning}33`}}>{k.alerta?"🔴 Alerta":"🟡 Preencher"}</span>
                </div>
              ))}
            </Card>
          </Section>
        </>
      )}
    </div>
  );
};

const VisaoFuncionario = ()=>(
  <div>
    <div style={{fontSize:18,fontWeight:900,color:"#E8F0F8",marginBottom:20,fontFamily:"'Georgia',serif"}}>Painel da Equipe</div>

    <Section icon="☀️" title="Verificar Agora — Início do Dia">
      <Card style={{borderColor:EMPRESA.accent+"33"}}>
        {["Verificar tasks pendentes e priorizá-las por prazo","Verificar mensagens não respondidas de clientes","Verificar prazos vencendo em 3 dias","Verificar casos sem movimentação há 7+ dias","Verificar leads sem follow-up há 3+ dias","Verificar contratos visualizados sem assinatura no PandaDoc"].map((item,i,arr)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<arr.length-1?"1px solid #1A3050":"none"}}>
            <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${EMPRESA.accent}44`,flexShrink:0}}/>
            <span style={{fontSize:13,color:"#C8D8E8"}}>{item}</span>
          </div>
        ))}
      </Card>
    </Section>

    <Section icon="⚠️" title="Atenção — Contratos Pendentes">
      <Card style={{borderColor:EMPRESA.warning+"33",background:EMPRESA.warning+"06"}}>
        <div style={{fontSize:13,color:"#D8C8A8",marginBottom:8}}><strong>21 contratos aguardando assinatura</strong> — $56,550.00 em aberto</div>
        <div style={{fontSize:12,color:"#8A9AAA"}}>👁 12 visualizaram mas não assinaram → Ligar imediatamente<br/>📤 9 não visualizaram → Reenviar e-mail</div>
      </Card>
    </Section>

    <Section icon="🎯" title="Leads — Ação Urgente">
      <Card style={{borderColor:EMPRESA.danger+"33",background:EMPRESA.danger+"06"}}>
        <div style={{fontSize:13,color:"#D8C8B8",lineHeight:2}}>
          ⚠️ <strong>738 leads sem status</strong> — qualificar ou arquivar no DW<br/>
          ⚠️ <strong>31 leads Open</strong> — qualificar ou arquivar<br/>
          ⚠️ <strong>18 em Contacting</strong> — acompanhar conversão
        </div>
      </Card>
    </Section>
  </div>
);

export default function App(){
  const [user,setUser]=useState(null);
  const [loginUser,setLoginUser]=useState("");
  const [loginPass,setLoginPass]=useState("");
  const [loginErr,setLoginErr]=useState(false);
  const [extras,setExtras]=useState({});
  const [tab,setTab]=useState("dashboard");

  const doLogin=()=>{
    const u=USUARIOS[loginUser.toLowerCase()];
    if(u&&u.senha===loginPass){setUser({...u,id:loginUser.toLowerCase()});setLoginErr(false);}
    else setLoginErr(true);
  };

  if(!user)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(145deg,#040C18,${EMPRESA.cor},#071A2E)`,fontFamily:"'Georgia',serif"}}>
      <div style={{width:340,textAlign:"center",padding:"0 20px"}}>
        <div style={{fontSize:52,marginBottom:10}}>⚖️</div>
        <div style={{fontSize:26,fontWeight:900,color:"#E8F0F8",marginBottom:4}}>Salvador Law PA</div>
        <div style={{width:40,height:2,background:EMPRESA.gold,margin:"10px auto 20px"}}/>
        <div style={{fontSize:11,color:"#3A5A7A",letterSpacing:2,textTransform:"uppercase",marginBottom:32}}>Dashboard de Gestão</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={loginUser} onChange={e=>{setLoginUser(e.target.value);setLoginErr(false);}} placeholder="Usuário" onKeyDown={e=>e.key==="Enter"&&doLogin()} style={{padding:"14px 18px",borderRadius:10,border:`1px solid ${loginErr?EMPRESA.danger:"#1A3050"}`,background:"#0A1828",color:"#E8F0F8",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <input value={loginPass} onChange={e=>{setLoginPass(e.target.value);setLoginErr(false);}} placeholder="Senha" type="password" onKeyDown={e=>e.key==="Enter"&&doLogin()} style={{padding:"14px 18px",borderRadius:10,border:`1px solid ${loginErr?EMPRESA.danger:"#1A3050"}`,background:"#0A1828",color:"#E8F0F8",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={doLogin} style={{padding:"14px",borderRadius:10,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${EMPRESA.accent},${EMPRESA.cor2})`,color:"white",fontSize:14,fontWeight:800,fontFamily:"inherit"}}>Entrar</button>
        </div>
        {loginErr&&<div style={{color:EMPRESA.danger,fontSize:12,marginTop:12}}>Usuário ou senha incorretos</div>}
        <div style={{marginTop:24,padding:14,background:"#0A1828",borderRadius:12,border:"1px solid #1A3050",textAlign:"left"}}>
          <div style={{fontSize:10,color:"#3A5A7A",marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Acesso</div>
          <div style={{fontSize:11,color:"#4A6A8A",lineHeight:1.8}}>👑 larissa / law123<br/>💼 assistente / law123</div>
        </div>
      </div>
    </div>
  );

  const isDono=user.papel==="dono";

  return(
    <div style={{minHeight:"100vh",background:"#060E1A",fontFamily:"system-ui,sans-serif",color:"#C8D8E8"}}>
      <div style={{padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",background:EMPRESA.cor,borderBottom:`1px solid ${EMPRESA.accent}22`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>⚖️</span>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#E8F0F8",fontFamily:"'Georgia',serif"}}>Salvador Law PA</div>
            <div style={{fontSize:10,color:"#3A5A7A"}}>Gestão Operacional</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#D8E4F0"}}>{user.nome}</div>
            <div style={{fontSize:10,color:EMPRESA.gold}}>{isDono?"👑 Advogada — Sócia":"💼 Equipe"}</div>
          </div>
          <button onClick={()=>{setUser(null);setLoginUser("");setLoginPass("");}} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${EMPRESA.danger}44`,background:"transparent",color:EMPRESA.danger,fontSize:11,fontWeight:700,cursor:"pointer"}}>Sair</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px 80px"}}>
        {isDono&&(
          <div style={{display:"flex",gap:4,padding:4,background:"#0A1828",borderRadius:12,marginBottom:20,border:"1px solid #1A3050"}}>
            {[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"upload",icon:"📥",label:"Atualizar Dados"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 8px",borderRadius:10,border:"none",background:tab===t.id?EMPRESA.accent+"22":"transparent",color:tab===t.id?EMPRESA.accent:"#3A5A7A",fontWeight:800,fontSize:12,cursor:"pointer",borderBottom:tab===t.id?`2px solid ${EMPRESA.accent}`:"2px solid transparent"}}>{t.icon} {t.label}</button>
            ))}
          </div>
        )}
        {isDono&&tab==="upload"&&<DropZone onExtras={setExtras} extras={extras}/>}
        {isDono&&tab==="dashboard"&&<VisaoDono dados={DADOS_REAIS} extras={extras}/>}
        {!isDono&&<VisaoFuncionario/>}
      </div>
    </div>
  );
}
