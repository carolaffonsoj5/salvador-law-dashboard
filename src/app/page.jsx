'use client';
import { useState, useCallback, useRef } from "react";

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

const processarRelatorio = (rows) => {
  if(!rows||rows.length===0)return null;
  const keys=Object.keys(rows[0]).map(k=>k.toLowerCase());
  const has=(k)=>keys.some(key=>key.includes(k));
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
        }else{newFiles.push({name:file.name,rows:"—",data:null,note:"Exporte como CSV"});}
      }catch(e){setError(`Erro ao ler ${file.name}`);}
    }
    setFiles(prev=>[...prev,...newFiles]);
    const allPartials=[...files,...newFiles].filter(f=>f.data).map(f=>f.data);
    if(allPartials.length>0){
      const novo={...extras};
      allPartials.forEach(p=>{
        if(p.faturamento)novo.faturamentoSemana=p.faturamento;
        if(p.equipe)novo.equipe=p.equipe;
        if(p.clientesPendentes)novo.clientesPagPendentes=p.clientesPendentes;
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
        <input ref={fileRef} type="file" accept=".csv,.txt" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
        <div style={{fontSize:32,marginBottom:6}}>{loading?"⏳":"📂"}</div>
        <div style={{fontSize:13,fontWeight:700,color:"#6A8AAA"}}>{loading?"Processando...":"Arraste CSV aqui"}</div>
        <div style={{fontSize:11,color:"#3A5A7A",marginTop:4}}>Customer details · Tech leaderboard</div>
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
  const taxaConv=d.leads.taxa;
  const ultimoMes=d.historico[d.historico.length-1];
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
            <Metric icon="📄" label="Contratos Pendentes" value={`${d.contratos.pendentes}`} sub={`${fmt(d.contratos.valorPendente)} em aberto`} color={EMPRESA.warning} big/>
            <Metric icon="🎯" label="Taxa Conversão" value={`${taxaConv}%`} sub={`Meta: ${d.leads.meta}% · ${d.leads.convertidos} convertidos`} color={taxaConv>=d.leads.meta?EMPRESA.success:EMPRESA.danger} big/>
            <Metric icon="👥" label="Total de Leads" value={d.leads.total.toLocaleString()} sub={`${d.leads.contacting} contato · ${d.leads.open} abertos`} color={EMPRESA.accent2}/>
            <Metric icon="📈" label={`Fechamento ${ultimoMes?.mes}`} value={`${ultimoMes?.taxa}%`} sub={`${ultimoMes?.assinados} assinados · ${fmt(ultimoMes?.valor||0)}`} color={ultimoMes?.taxa>=70?EMPRESA.success:EMPRESA.warning}/>
            <Metric icon="💰" label="Histórico Total" value={`$${(d.historico.reduce((s,h)=>s+h.valor,0)/1000).toFixed(0)}k`} sub={`${d.contratos.totalHistorico} contratos · 39 meses`} color={EMPRESA.gold}/>
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
                {txt:<><strong>Taxa de conversão {taxaConv}%</strong> — meta é {d.leads.meta}% · revisar qualificação e follow-up</>},
                {txt:<><strong>21 contratos pendentes</strong> · {fmt(d.contratos.valorPendente)} em aberto — ver aba Contratos</>},
              ].map((item,i,arr)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i<arr.length-1?"1px solid #1A3050":"none"}}>
                  <span style={{flexShrink:0}}>⚠️</span>
                  <span style={{fontSize:13,color:"#D8C8B8",lineHeight:1.5}}>{item.txt}</span>
                </div>
              ))}
            </Card>
          </Section>

          <Section icon="📈" title="Evolução — Últimos 6 Meses">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Card>
                <div style={{fontSize:10,color:"#3A5A7A",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Valor Fechado</div>
                <MiniBar data={d.historico.map(h=>({val:h.valor,label:h.mes}))} colorFn={()=>EMPRESA.accent}/>
              </Card>
              <Card>
                <div style={{fontSize:10,color:"#3A5A7A",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Taxa de Fechamento %</div>
                <MiniBar data={d.historico.map(h=>({val:Math.round(h.taxa),label:h.mes}))} colorFn={d=>d.val>=75?EMPRESA.success:d.val>=60?EMPRESA.warning:EMPRESA.danger}/>
              </Card>
            </div>
          </Section>
        </>
      )}

      {aba==="contratos"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            <Metric icon="📄" label="Pendentes" value={d.contratos.pendentes} sub={fmt(d.contratos.valorPendente)} color={EMPRESA.warning} big/>
            <Metric icon="👁" label="Viram, não assinaram" value={d.contratos.visualizaramNaoAssinaram} sub="Ligar imediatamente" color={EMPRESA.danger}/>
            <Metric icon="📤" label="Nem visualizaram" value={d.contratos.naoVisualizaram} sub="Reenviar e-mail" color={EMPRESA.warning}/>
          </div>

          <Section icon="⚠️" title="Contratos Pendentes — Ação Imediata" count={d.contratos.pendentes}>
            <Card>
              {d.contratosPendentes.map((c,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<d.contratosPendentes.length-1?"1px solid #1A3050":"none",gap:10}}>
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
              {d.historico.map((h,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<d.historico.length-1?"1px solid #1A3050":"none"}}>
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
                <div style={{fontSize:40,fontWeight:900,color:taxaConv>=d.leads.meta?EMPRESA.success:EMPRESA.danger,fontFamily:"'Georgia',serif"}}>{taxaConv}%</div>
                <div style={{fontSize:12,color:"#4A6A8A",marginTop:4}}>Meta: {d.leads.meta}% · {taxaConv<d.leads.meta?`${(d.leads.meta-taxaConv).toFixed(1)}pp abaixo`:"✅ Meta atingida"}</div>
              </div>
              <Ring value={Math.round(taxaConv)} size={80} color={taxaConv>=d.leads.meta?EMPRESA.success:EMPRESA.danger}/>
            </div>
            <div style={{marginTop:16,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center"}}>
              {[{l:"Total",v:d.leads.total,c:EMPRESA.accent2},{l:"Convertidos",v:d.leads.convertidos,c:EMPRESA.success},{l:"Em Contato",v:d.leads.contacting,c:EMPRESA.warning},{l:"Sem Status",v:d.leads.semStatus,c:EMPRESA.danger}].map((item,i)=>(
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

      {aba==="kpis"&&(
        <>
          <Section icon="🔑" title="KPIs da Advogada — Larissa" badge={<Badge text="Preencher semanalmente" color={EMPRESA.gold}/>}>
            <Card>
              {d.kpisAdvogada.map((k,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<d.kpisAdvogada.length-1?"1px solid #1A3050":"none",gap:10}}>
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
              {d.kpisEquipe.map((k,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<d.kpisEquipe.length-1?"1px solid #1A3050":"none",gap:10}}>
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
