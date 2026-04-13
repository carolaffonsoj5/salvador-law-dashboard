'use client';
import { useState, useEffect, useCallback, useRef } from "react";

/*
═══════════════════════════════════════════════════════════════
  DASHBOARD DE GESTÃO SEMANAL
  Upload de relatórios + API HouseCall Pro
  Visão Dono vs Funcionário — Reunião de segunda-feira
═══════════════════════════════════════════════════════════════
*/

// ── CONFIG ───────────────────────────────────────────────────
const EMPRESA = {
  nome: "Alpha Breezy HVAC Corp",
  segmento: "HVAC — Heating, Ventilation & Air Conditioning",
  icon: "🌀",
  cor: "#0A1929", cor2: "#163A5F",
  accent: "#00BFA6", accent2: "#64FFDA",
  danger: "#FF5252", warning: "#FFB74D", success: "#69F0AE",
};

const USUARIOS = {
  wilson: { senha: "alpha123", papel: "dono", nome: "Wilson Affonso", tecnico: true },
  maria: { senha: "alpha123", papel: "dono", nome: "Maria Affonso" },
  carolina: { senha: "alpha123", papel: "gerente", nome: "Carolina Affonso" },
  nicolas: { senha: "alpha123", papel: "atendente", nome: "Nicolas Affonso" },
};

// ── DADOS INICIAIS (substituídos pelo upload/API) ────────────
const DADOS_VAZIO = {
  semana: "", fonte: "manual",
  os: { total: 0, concluidas: 0, pendentes: 0, canceladas: 0 },
  faturamento: { total: 0, recebido: 0, pendente: 0 },
  tecnicos: [],
  contratos: { enviados: 0, assinados: 0, expirados: 0, valorFechado: 0 },
  leads: { novos: 0, convertidos: 0, semRetorno: 0, pipeline: 0 },
  estoque: [],
  clientes: { ativos: 0, novos: 0, reclamacoes: 0 },
  destaques: [],
  problemas: [],
  historico: [],
};

const DADOS_DEMO = {
  semana: "07/04/2026 — 13/04/2026", fonte: "upload",
  os: { total: 34, concluidas: 29, pendentes: 3, canceladas: 2 },
  faturamento: { total: 28400, recebido: 22100, pendente: 6300 },
  tecnicos: [
    { nome: "Wilson Affonso", os_total: 34, os_concluidas: 29, os_pendentes: 3, os_canceladas: 2, faturado: 28400, tarefas_pendentes: 3, avaliacao: 4.8 },
  ],
  contratos: { enviados: 8, assinados: 5, expirados: 1, valorFechado: 15400 },
  leads: { novos: 12, convertidos: 4, semRetorno: 3, pipeline: 25150 },
  estoque: [
    { item: "Gás R-410A", qtd: 3, min: 5, status: "critico" },
    { item: "Filtro G4", qtd: 12, min: 10, status: "ok" },
    { item: "Dreno 3/4", qtd: 8, min: 15, status: "critico" },
    { item: "Gás R-22", qtd: 1, min: 3, status: "critico" },
    { item: "Suporte externo", qtd: 6, min: 4, status: "ok" },
    { item: "Cabo 2,5mm", qtd: 45, min: 20, status: "ok" },
  ],
  clientes: { ativos: 87, novos: 6, reclamacoes: 1 },
  destaques: [
    "João concluiu 16/18 OS — taxa de 89%",
    "5 contratos assinados — R$ 15.400 fechados",
    "6 clientes novos na semana",
    "Avaliação média 4.65 estrelas",
  ],
  problemas: [
    "3 leads sem retorno há mais de 3 dias — follow-up urgente",
    "3 itens de estoque abaixo do mínimo — Gás R-410A, Dreno 3/4, Gás R-22",
    "1 reclamação de cliente — tratar na reunião",
    "Pedro com 3 tarefas pendentes — cobrar na reunião",
    "1 contrato expirado — verificar e reenviar",
  ],
  historico: [
    { semana: "10/03 — 16/03", os: 28, fat: 22100, contratos: 3, leads: 8 },
    { semana: "17/03 — 23/03", os: 31, fat: 25800, contratos: 4, leads: 10 },
    { semana: "24/03 — 30/03", os: 26, fat: 19600, contratos: 2, leads: 7 },
    { semana: "31/03 — 06/04", os: 33, fat: 27200, contratos: 6, leads: 11 },
    { semana: "07/04 — 13/04", os: 34, fat: 28400, contratos: 5, leads: 12 },
  ],
};

// ── HELPERS ──────────────────────────────────────────────────
const fmt = (v) => `R$ ${(v||0).toLocaleString("pt-BR")}`;
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

// ── PARSER DE CSV/EXCEL (lê relatórios HouseCall Pro) ────────
const parseCSV = (text) => {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
};

const processarRelatorio = (rows) => {
  if (!rows || rows.length === 0) return null;
  const keys = Object.keys(rows[0]);
  const has = (k) => keys.some(key => key.includes(k));

  // Tenta detectar tipo de relatório
  if (has("job") || has("service") || has("work order") || has("os")) {
    return processarOS(rows);
  }
  if (has("invoice") || has("payment") || has("amount")) {
    return processarFinanceiro(rows);
  }
  if (has("customer") || has("client") || has("lead")) {
    return processarClientes(rows);
  }
  // Genérico — tenta extrair o que der
  return processarGenerico(rows);
};

const processarOS = (rows) => {
  let total = rows.length, concluidas = 0, pendentes = 0, canceladas = 0;
  const tecMap = {};
  let fatTotal = 0;

  rows.forEach(r => {
    const status = (r.status || r.state || r["job status"] || "").toLowerCase();
    const tec = r.technician || r.tech || r["assigned to"] || r.tecnico || "Não atribuído";
    const valor = parseFloat((r.total || r.amount || r.value || r.valor || "0").replace(/[^0-9.]/g, "")) || 0;

    if (status.includes("complet") || status.includes("done") || status.includes("conclu")) concluidas++;
    else if (status.includes("cancel")) canceladas++;
    else pendentes++;

    fatTotal += valor;
    if (!tecMap[tec]) tecMap[tec] = { nome: tec, os_total: 0, os_concluidas: 0, os_pendentes: 0, os_canceladas: 0, faturado: 0, tarefas_pendentes: 0, avaliacao: 0 };
    tecMap[tec].os_total++;
    if (status.includes("complet") || status.includes("done") || status.includes("conclu")) { tecMap[tec].os_concluidas++; tecMap[tec].faturado += valor; }
    else if (status.includes("cancel")) tecMap[tec].os_canceladas++;
    else { tecMap[tec].os_pendentes++; tecMap[tec].tarefas_pendentes++; }
  });

  return {
    os: { total, concluidas, pendentes, canceladas },
    faturamento: { total: fatTotal, recebido: Math.round(fatTotal * 0.78), pendente: Math.round(fatTotal * 0.22) },
    tecnicos: Object.values(tecMap),
  };
};

const processarFinanceiro = (rows) => {
  let total = 0, recebido = 0;
  rows.forEach(r => {
    const val = parseFloat((r.total || r.amount || r.value || "0").replace(/[^0-9.]/g, "")) || 0;
    const status = (r.status || r.state || "").toLowerCase();
    total += val;
    if (status.includes("paid") || status.includes("received") || status.includes("pago")) recebido += val;
  });
  return { faturamento: { total, recebido, pendente: total - recebido } };
};

const processarClientes = (rows) => {
  let novos = 0, semRetorno = 0, convertidos = 0, pipeline = 0;
  rows.forEach(r => {
    const status = (r.status || r.state || "").toLowerCase();
    const val = parseFloat((r.value || r.amount || r.total || "0").replace(/[^0-9.]/g, "")) || 0;
    pipeline += val;
    if (status.includes("new") || status.includes("nov")) novos++;
    if (status.includes("convert") || status.includes("won") || status.includes("fechad")) convertidos++;
    if (status.includes("no response") || status.includes("sem ret")) semRetorno++;
  });
  return { leads: { novos: novos || rows.length, convertidos, semRetorno, pipeline } };
};

const processarGenerico = (rows) => {
  return { clientes: { ativos: rows.length, novos: 0, reclamacoes: 0 } };
};

// ── COMPONENTES UI ──────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: "#0D1B2A", borderRadius: 16, padding: "20px 22px", border: "1px solid #1A2A3A", ...style }}>{children}</div>
);

const Metric = ({ icon, label, value, sub, color, big }) => (
  <Card>
    <div style={{ fontSize: 10, color: "#5A6A7A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{icon} {label}</div>
    <div style={{ fontSize: big ? 32 : 24, fontWeight: 900, color: color || "#E8F0F8", letterSpacing: -1, fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#4A5A6A", marginTop: 4 }}>{sub}</div>}
  </Card>
);

const Badge = ({ text, color }) => (
  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: (color || "#888") + "18", color: color || "#888", border: `1px solid ${(color || "#888")}33` }}>{text}</span>
);

const MiniBar = ({ data, color, height = 80 }) => {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ fontSize: 8, color: "#6A7A8A", fontWeight: 700 }}>{d.val >= 1000 ? `${Math.round(d.val/1000)}k` : d.val}</div>
          <div style={{ width: "100%", borderRadius: 4, height: `${Math.max((d.val/max)*(height-24), 3)}px`, background: `linear-gradient(180deg, ${color}, ${color}66)`, transition: "height .6s ease" }} />
          <div style={{ fontSize: 7, color: "#4A5A6A" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

const Ring = ({ value, size = 56, color }) => {
  const r = (size - 6) / 2, circ = 2 * Math.PI * r, off = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1A2A3A" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: 13, fontWeight: 800, fill: color }}>{value}%</text>
    </svg>
  );
};

const Section = ({ icon, title, count, children }) => (
  <div style={{ marginTop: 28 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: "#C8D8E8", letterSpacing: -0.3 }}>{title}</span>
      {count != null && <span style={{ fontSize: 10, color: "#4A5A6A", background: "#1A2A3A", padding: "2px 10px", borderRadius: 20, fontWeight: 700 }}>{count}</span>}
    </div>
    {children}
  </div>
);

// ── DROP ZONE ───────────────────────────────────────────────
const DropZone = ({ onData, dados }) => {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFiles = async (fileList) => {
    setError(""); setLoading(true);
    const newFiles = [];

    for (const file of fileList) {
      const ext = file.name.split(".").pop().toLowerCase();
      try {
        if (ext === "csv" || ext === "txt") {
          const text = await file.text();
          const rows = parseCSV(text);
          if (rows) {
            const partial = processarRelatorio(rows);
            if (partial) { newFiles.push({ name: file.name, rows: rows.length, type: ext, data: partial }); }
            else { setError(`Não consegui interpretar ${file.name}. Tente um CSV do HouseCall Pro.`); }
          }
        } else if (ext === "xlsx" || ext === "xls") {
          newFiles.push({ name: file.name, rows: "—", type: ext, data: null, note: "Excel detectado — pra leitura automática de .xlsx, exporte como CSV no HouseCall Pro" });
        } else if (ext === "pdf") {
          newFiles.push({ name: file.name, rows: "—", type: ext, data: null, note: "PDF detectado — pra leitura automática, exporte como CSV no HouseCall Pro" });
        } else {
          setError(`Formato .${ext} não suportado. Use CSV, XLSX ou PDF.`);
        }
      } catch (e) { setError(`Erro ao ler ${file.name}`); }
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Merge dados dos arquivos processados
    const merged = { ...DADOS_VAZIO, semana: new Date().toLocaleDateString("pt-BR"), fonte: "upload" };
    const allPartials = [...files, ...newFiles].filter(f => f.data).map(f => f.data);
    allPartials.forEach(p => {
      if (p.os) merged.os = p.os;
      if (p.faturamento) merged.faturamento = p.faturamento;
      if (p.tecnicos) merged.tecnicos = p.tecnicos;
      if (p.leads) merged.leads = p.leads;
      if (p.clientes) merged.clientes = p.clientes;
    });

    // Gerar destaques e problemas automáticos
    merged.destaques = [];
    merged.problemas = [];
    if (merged.os.total > 0) {
      const taxa = pct(merged.os.concluidas, merged.os.total);
      merged.destaques.push(`${merged.os.concluidas}/${merged.os.total} OS concluídas — taxa de ${taxa}%`);
      if (merged.os.pendentes > 0) merged.problemas.push(`${merged.os.pendentes} OS pendente${merged.os.pendentes > 1 ? "s" : ""} — verificar motivo`);
      if (merged.os.canceladas > 0) merged.problemas.push(`${merged.os.canceladas} OS cancelada${merged.os.canceladas > 1 ? "s" : ""} — analisar causa`);
    }
    if (merged.faturamento.total > 0) merged.destaques.push(`Faturamento da semana: ${fmt(merged.faturamento.total)}`);
    if (merged.faturamento.pendente > 0) merged.problemas.push(`${fmt(merged.faturamento.pendente)} em pagamentos pendentes`);
    if (merged.leads.semRetorno > 0) merged.problemas.push(`${merged.leads.semRetorno} lead${merged.leads.semRetorno > 1 ? "s" : ""} sem retorno — follow-up urgente`);
    merged.tecnicos.forEach(t => {
      if (t.tarefas_pendentes > 0) merged.problemas.push(`${t.nome}: ${t.tarefas_pendentes} tarefa${t.tarefas_pendentes > 1 ? "s" : ""} pendente${t.tarefas_pendentes > 1 ? "s" : ""}`);
    });

    if (allPartials.length > 0) onData(merged);
    setLoading(false);
  };

  const onDrop = useCallback((e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }, [files]);
  const onDragOver = (e) => { e.preventDefault(); setDrag(true); };
  const onDragLeave = () => setDrag(false);

  return (
    <div>
      {/* Drop area */}
      <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? EMPRESA.accent : "#1A2A3A"}`,
          borderRadius: 16, padding: "36px 20px", textAlign: "center",
          background: drag ? EMPRESA.accent + "08" : "#0A1020",
          cursor: "pointer", transition: "all .3s",
          marginBottom: 16,
        }}>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.txt" multiple
          style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        <div style={{ fontSize: 40, marginBottom: 8 }}>{loading ? "⏳" : drag ? "📥" : "📊"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: drag ? EMPRESA.accent : "#8899AA", marginBottom: 4 }}>
          {loading ? "Processando..." : "Arraste o relatório aqui"}
        </div>
        <div style={{ fontSize: 11, color: "#4A5A6A" }}>
          CSV do HouseCall Pro, PandaDoc ou qualquer planilha
        </div>
        <div style={{ fontSize: 10, color: "#3A4A5A", marginTop: 8 }}>
          Aceita: .csv · .xlsx · .pdf — Clique ou arraste
        </div>
      </div>

      {error && <div style={{ padding: "10px 14px", background: EMPRESA.danger + "12", border: `1px solid ${EMPRESA.danger}33`, borderRadius: 10, fontSize: 12, color: EMPRESA.danger, marginBottom: 12 }}>⚠️ {error}</div>}

      {/* Arquivos carregados */}
      {files.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4A5A6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Arquivos carregados</div>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#0D1B2A", borderRadius: 8, marginBottom: 4, border: "1px solid #1A2A3A" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{f.data ? "✅" : "📎"}</span>
                <span style={{ fontSize: 12, color: "#C8D8E8", fontWeight: 600 }}>{f.name}</span>
                {f.data && <Badge text={`${f.rows} linhas`} color={EMPRESA.success} />}
              </div>
              {f.note && <span style={{ fontSize: 10, color: EMPRESA.warning }}>{f.note}</span>}
              {f.data && <Badge text="Processado ✓" color={EMPRESA.success} />}
            </div>
          ))}
        </div>
      )}

      {/* Botão demo */}
      {!dados.semana && files.length === 0 && (
        <button onClick={() => onData(DADOS_DEMO)} style={{
          width: "100%", padding: "12px", borderRadius: 10, border: `1px dashed ${EMPRESA.accent}44`,
          background: "transparent", color: EMPRESA.accent, fontSize: 12, fontWeight: 600,
          cursor: "pointer", marginTop: 4,
        }}>
          🎮 Carregar dados de demonstração (pra testar)
        </button>
      )}
    </div>
  );
};

// ── TELA: VISÃO DO DONO (REUNIÃO SEMANAL) ───────────────────
const VisaoDono = ({ dados }) => {
  const d = dados;
  const taxaOS = pct(d.os.concluidas, d.os.total);
  const taxaContr = pct(d.contratos.assinados, d.contratos.enviados);
  const estCrit = d.estoque.filter(e => e.status === "critico").length;

  return (
    <div>
      {/* Semana */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "#4A5A6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Semana</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#E8F0F8" }}>{d.semana || "—"}</div>
        </div>
        <Badge text={d.fonte === "upload" ? "📊 Via relatório" : d.fonte === "api" ? "🔗 API HouseCall" : "Manual"} color={EMPRESA.accent} />
      </div>

      {/* KPIs principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <Metric icon="💰" label="Faturamento" value={fmt(d.faturamento.total)} sub={`${fmt(d.faturamento.pendente)} pendente`} color={EMPRESA.success} big />
        <Metric icon="🔧" label="OS Concluídas" value={`${d.os.concluidas}/${d.os.total}`} sub={`Taxa: ${taxaOS}%`} color={taxaOS >= 80 ? EMPRESA.success : EMPRESA.warning} />
        <Metric icon="📄" label="Contratos" value={`${d.contratos.assinados}/${d.contratos.enviados}`} sub={`${fmt(d.contratos.valorFechado)} fechado`} color={taxaContr >= 50 ? EMPRESA.success : EMPRESA.warning} />
        <Metric icon="🎯" label="Leads" value={d.leads.novos} sub={`${d.leads.convertidos} convertidos · ${d.leads.semRetorno} sem ret.`} color={EMPRESA.accent2} />
        <Metric icon="👥" label="Clientes" value={d.clientes.ativos} sub={`${d.clientes.novos} novos · ${d.clientes.reclamacoes} reclamação`} color={EMPRESA.accent} />
      </div>

      {/* Problemas — O QUE COBRAR NA REUNIÃO */}
      {d.problemas.length > 0 && (
        <Section icon="🔴" title="COBRAR NA REUNIÃO" count={d.problemas.length}>
          <Card style={{ borderColor: EMPRESA.danger + "33", background: EMPRESA.danger + "06" }}>
            {d.problemas.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < d.problemas.length - 1 ? "1px solid #1A2A3A" : "none" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                <span style={{ fontSize: 13, color: "#D8C8B8", lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Destaques positivos */}
      {d.destaques.length > 0 && (
        <Section icon="✅" title="Destaques da Semana" count={d.destaques.length}>
          <Card style={{ borderColor: EMPRESA.success + "33", background: EMPRESA.success + "06" }}>
            {d.destaques.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < d.destaques.length - 1 ? "1px solid #1A2A3A" : "none" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>
                <span style={{ fontSize: 13, color: "#B8D8C8", lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Performance por técnico */}
      {d.tecnicos.length > 0 && (
        <Section icon="👥" title="Performance por Técnico" count={d.tecnicos.length}>
          {d.tecnicos.map((t, i) => (
            <Card key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#D8E4F0" }}>🔧 {t.nome}</div>
                <Ring value={pct(t.os_concluidas, t.os_total)} size={50} color={pct(t.os_concluidas, t.os_total) >= 80 ? EMPRESA.success : EMPRESA.warning} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                <div><div style={{ fontSize: 18, fontWeight: 800, color: EMPRESA.accent }}>{t.os_total}</div><div style={{ fontSize: 9, color: "#4A5A6A" }}>OS total</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 800, color: EMPRESA.success }}>{t.os_concluidas}</div><div style={{ fontSize: 9, color: "#4A5A6A" }}>Concluídas</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 800, color: t.tarefas_pendentes > 0 ? EMPRESA.warning : EMPRESA.success }}>{t.tarefas_pendentes}</div><div style={{ fontSize: 9, color: "#4A5A6A" }}>Pendentes</div></div>
                <div><div style={{ fontSize: 18, fontWeight: 800, color: "#8899AA" }}>{fmt(t.faturado)}</div><div style={{ fontSize: 9, color: "#4A5A6A" }}>Faturado</div></div>
              </div>
            </Card>
          ))}
        </Section>
      )}

      {/* Estoque crítico */}
      {estCrit > 0 && (
        <Section icon="📦" title="Estoque Crítico" count={estCrit}>
          <Card style={{ borderColor: EMPRESA.danger + "33" }}>
            {d.estoque.filter(e => e.status === "critico").map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < estCrit - 1 ? "1px solid #1A2A3A" : "none" }}>
                <span style={{ fontSize: 13, color: "#D8E4F0" }}>⚠️ {e.item}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: EMPRESA.danger, fontWeight: 700 }}>{e.qtd}</span>
                  <span style={{ fontSize: 10, color: "#4A5A6A" }}>mín: {e.min}</span>
                </div>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Histórico semanal */}
      {d.historico.length > 0 && (
        <Section icon="📈" title="Evolução Semanal">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Card>
              <div style={{ fontSize: 10, color: "#4A5A6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Faturamento</div>
              <MiniBar data={d.historico.map(h => ({ val: h.fat, label: h.semana.split("—")[0].trim() }))} color={EMPRESA.accent} />
            </Card>
            <Card>
              <div style={{ fontSize: 10, color: "#4A5A6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>OS Concluídas</div>
              <MiniBar data={d.historico.map(h => ({ val: h.os, label: h.semana.split("—")[0].trim() }))} color={EMPRESA.success} />
            </Card>
          </div>
        </Section>
      )}
    </div>
  );
};

// ── TELA: VISÃO DO FUNCIONÁRIO ──────────────────────────────
const VisaoFuncionario = ({ dados, nome }) => {
  const primeiro = nome.split(" ")[0];
  const meusDados = dados.tecnicos.find(t => t.nome.includes(primeiro));
  const taxaOS = meusDados ? pct(meusDados.os_concluidas, meusDados.os_total) : 0;

  return (
    <div>
      <div style={{ fontSize: 11, color: "#4A5A6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Semana</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#E8F0F8", marginBottom: 20 }}>{dados.semana || "—"}</div>

      {meusDados ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Metric icon="📋" label="Minhas OS" value={meusDados.os_total} color={EMPRESA.accent} />
            <Metric icon="✅" label="Concluídas" value={meusDados.os_concluidas} sub={`${taxaOS}%`} color={EMPRESA.success} />
            <Metric icon="⏳" label="Pendentes" value={meusDados.tarefas_pendentes} color={meusDados.tarefas_pendentes > 0 ? EMPRESA.warning : EMPRESA.success} />
          </div>

          <Section icon="📊" title="Minha Performance">
            <Card>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Ring value={taxaOS} size={80} color={taxaOS >= 80 ? EMPRESA.success : EMPRESA.warning} />
              </div>
              <div style={{ textAlign: "center", fontSize: 13, color: "#8899AA" }}>
                {taxaOS >= 90 ? "🏆 Excelente semana!" : taxaOS >= 80 ? "👍 Boa semana!" : taxaOS >= 60 ? "⚡ Pode melhorar" : "⚠️ Abaixo do esperado"}
              </div>
            </Card>
          </Section>

          {meusDados.tarefas_pendentes > 0 && (
            <Section icon="⚠️" title="Atenção">
              <Card style={{ borderColor: EMPRESA.warning + "33", background: EMPRESA.warning + "06" }}>
                <div style={{ fontSize: 13, color: "#D8C8A8" }}>
                  Você tem <strong>{meusDados.tarefas_pendentes}</strong> tarefa{meusDados.tarefas_pendentes > 1 ? "s" : ""} pendente{meusDados.tarefas_pendentes > 1 ? "s" : ""}. Resolva antes da próxima reunião.
                </div>
              </Card>
            </Section>
          )}
        </>
      ) : (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14, color: "#8899AA" }}>Seus dados ainda não foram carregados nesta semana</div>
          <div style={{ fontSize: 12, color: "#4A5A6A", marginTop: 8 }}>O dono precisa fazer o upload do relatório semanal</div>
        </Card>
      )}

      {/* Estoque — sempre útil pro técnico */}
      {dados.estoque.filter(e => e.status === "critico").length > 0 && (
        <Section icon="📦" title="Estoque em Falta">
          <Card style={{ borderColor: EMPRESA.danger + "33" }}>
            {dados.estoque.filter(e => e.status === "critico").map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: "#AAB8C8", padding: "4px 0" }}>⚠️ {e.item} — apenas {e.qtd} (mín: {e.min})</div>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
};

// ── TELA: VISÃO ATENDENTE ───────────────────────────────────
const VisaoAtendente = ({ dados }) => (
  <div>
    <div style={{ fontSize: 11, color: "#4A5A6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Semana</div>
    <div style={{ fontSize: 16, fontWeight: 800, color: "#E8F0F8", marginBottom: 20 }}>{dados.semana || "—"}</div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
      <Metric icon="🎯" label="Leads Novos" value={dados.leads.novos} color={EMPRESA.accent2} />
      <Metric icon="❌" label="Sem Retorno" value={dados.leads.semRetorno} color={dados.leads.semRetorno > 0 ? EMPRESA.danger : EMPRESA.success} />
      <Metric icon="📄" label="Contratos" value={`${dados.contratos.assinados}/${dados.contratos.enviados}`} color={EMPRESA.accent} />
      <Metric icon="🔧" label="OS Semana" value={dados.os.total} sub={`${dados.os.concluidas} concluídas`} color={EMPRESA.success} />
    </div>

    {dados.leads.semRetorno > 0 && (
      <Section icon="🔴" title="Follow-up Urgente">
        <Card style={{ borderColor: EMPRESA.danger + "33", background: EMPRESA.danger + "06" }}>
          <div style={{ fontSize: 13, color: "#D8C8B8" }}>
            <strong>{dados.leads.semRetorno} lead{dados.leads.semRetorno > 1 ? "s" : ""}</strong> sem retorno. Ligue ou mande mensagem hoje.
          </div>
        </Card>
      </Section>
    )}

    {dados.contratos.expirados > 0 && (
      <Section icon="⚠️" title="Contratos Expirados">
        <Card style={{ borderColor: EMPRESA.warning + "33", background: EMPRESA.warning + "06" }}>
          <div style={{ fontSize: 13, color: "#D8C8A8" }}>
            <strong>{dados.contratos.expirados} contrato{dados.contratos.expirados > 1 ? "s" : ""}</strong> expirado{dados.contratos.expirados > 1 ? "s" : ""} — verificar e reenviar via PandaDoc.
          </div>
        </Card>
      </Section>
    )}

    {/* Equipe status */}
    {dados.tecnicos.length > 0 && (
      <Section icon="👥" title="Equipe — Status">
        {dados.tecnicos.map((t, i) => (
          <Card key={i} style={{ marginBottom: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#D8E4F0" }}>🔧 {t.nome}</span>
              <span style={{ fontSize: 12, color: EMPRESA.accent }}>{t.os_concluidas}/{t.os_total} OS</span>
            </div>
          </Card>
        ))}
      </Section>
    )}
  </div>
);

// ── APP PRINCIPAL ───────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState(false);
  const [dados, setDados] = useState(DADOS_VAZIO);
  const [tab, setTab] = useState("dashboard");

  const doLogin = () => {
    const u = USUARIOS[loginUser.toLowerCase()];
    if (u && u.senha === loginPass) { setUser({ ...u, id: loginUser.toLowerCase() }); setLoginErr(false); }
    else setLoginErr(true);
  };

  // ── LOGIN ──
  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, #050D1A, ${EMPRESA.cor}, #0A1628)`, fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif" }}>
      <div style={{ width: 340, textAlign: "center", padding: "0 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{EMPRESA.icon}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#E8F0F8", letterSpacing: -1, marginBottom: 4 }}>{EMPRESA.nome}</div>
        <div style={{ fontSize: 12, color: "#4A5A6A", marginBottom: 32 }}>{EMPRESA.segmento}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={loginUser} onChange={e => { setLoginUser(e.target.value); setLoginErr(false); }} placeholder="Usuário" onKeyDown={e => e.key === "Enter" && doLogin()} style={{ padding: "14px 18px", borderRadius: 12, border: `1px solid ${loginErr ? EMPRESA.danger : "#1A2A3A"}`, background: "#0A1628", color: "#E8F0F8", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <input value={loginPass} onChange={e => { setLoginPass(e.target.value); setLoginErr(false); }} placeholder="Senha" type="password" onKeyDown={e => e.key === "Enter" && doLogin()} style={{ padding: "14px 18px", borderRadius: 12, border: `1px solid ${loginErr ? EMPRESA.danger : "#1A2A3A"}`, background: "#0A1628", color: "#E8F0F8", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <button onClick={doLogin} style={{ padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${EMPRESA.accent}, ${EMPRESA.cor2})`, color: "white", fontSize: 14, fontWeight: 800, fontFamily: "inherit" }}>Entrar</button>
        </div>
        {loginErr && <div style={{ color: EMPRESA.danger, fontSize: 12, marginTop: 12 }}>Usuário ou senha incorretos</div>}
        <div style={{ marginTop: 28, padding: 16, background: "#0A1628", borderRadius: 12, border: "1px solid #1A2A3A", textAlign: "left" }}>
          <div style={{ fontSize: 10, color: "#4A5A6A", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Acesso</div>
          <div style={{ fontSize: 11, color: "#5A6A7A", lineHeight: 1.8 }}>👑🔧 wilson → Dono + Técnico<br/>👑💰 maria → Dona + Financeiro<br/>📋 carolina → Gerente<br/>📞 nicolas → Assistente</div>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ──
  const isDono = user.papel === "dono";
  const isGerente = user.papel === "gerente";
  const isAssistente = user.papel === "atendente";
  const isWilson = user.tecnico === true; // Wilson é dono + técnico
  const canUpload = isDono || isGerente; // Dono e gerente podem subir dados
  const canSeeFull = isDono || isGerente; // Visão completa
  const badge = { dono: user.tecnico ? "👑🔧 Dono + Técnico" : "👑 Dono(a)", gerente: "📋 Gerente", atendente: "📞 Assistente" };

  return (
    <div style={{ minHeight: "100vh", background: "#070F1C", fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif", color: "#C8D8E8" }}>
      {/* Header */}
      <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: EMPRESA.cor, borderBottom: `1px solid ${EMPRESA.accent}22`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{EMPRESA.icon}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#E8F0F8", letterSpacing: -0.5 }}>{EMPRESA.nome}</div>
            <div style={{ fontSize: 10, color: "#4A6A8A" }}>Gestão Semanal</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#D8E4F0" }}>{user.nome}</div>
            <div style={{ fontSize: 10, color: EMPRESA.accent }}>{badge[user.papel]}</div>
          </div>
          <button onClick={() => { setUser(null); setLoginUser(""); setLoginPass(""); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${EMPRESA.danger}44`, background: "transparent", color: EMPRESA.danger, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px" }}>
        {/* Tabs — dono e gerente podem fazer upload */}
        {canUpload && (
          <div style={{ display: "flex", gap: 4, padding: 4, background: "#0A1628", borderRadius: 12, marginBottom: 20 }}>
            {[
              { id: "dashboard", icon: "📊", label: "Dashboard" },
              { id: "upload", icon: "📥", label: "Atualizar Dados" },
              ...(isWilson ? [{ id: "meutrabalho", icon: "🔧", label: "Meu Trabalho" }] : []),
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", background: tab === t.id ? EMPRESA.accent + "22" : "transparent", color: tab === t.id ? EMPRESA.accent : "#4A5A6A", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit", borderBottom: tab === t.id ? `2px solid ${EMPRESA.accent}` : "2px solid transparent" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo */}
        {canUpload && tab === "upload" && <DropZone onData={setDados} dados={dados} />}
        {canSeeFull && tab === "dashboard" && (dados.semana ? <VisaoDono dados={dados} /> : (
          <Card style={{ textAlign: "center", padding: 50 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#8899AA", marginBottom: 8 }}>Nenhum relatório carregado</div>
            <div style={{ fontSize: 13, color: "#4A5A6A", marginBottom: 20 }}>Vá em "Atualizar Dados" e arraste o relatório da semana</div>
            <button onClick={() => setTab("upload")} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: EMPRESA.accent, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>📥 Ir para Upload</button>
          </Card>
        ))}
        {isWilson && tab === "meutrabalho" && <VisaoFuncionario dados={dados} nome={user.nome} />}

        {isAssistente && <VisaoAtendente dados={dados} />}
      </div>
    </div>
  );
}
