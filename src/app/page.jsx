'use client';
import { useState, useCallback, useRef } from "react";

/*
═══════════════════════════════════════════════════════════════
  SALVADOR LAW PA — Dashboard de Gestão
  Visão Dono + Funcionários
═══════════════════════════════════════════════════════════════
*/

const EMPRESA = {
  nome: "Salvador Law PA",
  segmento: "Escritório de Advocacia",
  icon: "⚖️",
  cor: "#071525",
  cor2: "#0D2137",
  accent: "#1E6FBF",
  accent2: "#4DA3FF",
  gold: "#C9A84C",
  danger: "#E05252",
  warning: "#E09B2A",
  success: "#2ECC8F",
};

const USUARIOS = {
  larissa: { senha: "law123", papel: "dono", nome: "Larissa Salvador", avatar: "👑" },
  assistente: { senha: "law123", papel: "funcionario", nome: "Assistente", avatar: "💼" },
};

const DADOS_VAZIO = {
  semana: "", fonte: "manual",
  casos: { total: 0, ativos: 0, encerrados: 0, novos: 0 },
  faturamento: { total: 0, recebido: 0, pendente: 0 },
  consultas: { agendadas: 0, realizadas: 0, canceladas: 0 },
  clientes: { ativos: 0, novos: 0, retorno: 0 },
  equipe: [],
  clientesPendentes: [],
  destaques: [],
  problemas: [],
  historico: [],
};

const DADOS_DEMO = {
  semana: "07/04/2026 — 13/04/2026", fonte: "demo",
  casos: { total: 28, ativos: 18, encerrados: 7, novos: 3 },
  faturamento: { total: 42500, recebido: 31000, pendente: 11500 },
  consultas: { agendadas: 12, realizadas: 10, canceladas: 2 },
  clientes: { ativos: 28, novos: 3, retorno: 5 },
  equipe: [
    { nome: "Larissa Salvador", casos: 15, faturado: 32000, pendente: 8000, horas: 42 },
    { nome: "Assistente", casos: 13, faturado: 10500, pendente: 3500, horas: 38 },
  ],
  clientesPendentes: [
    { nome: "Empresa XYZ Ltda", pendente: 6500, revenue: 12000 },
    { nome: "João Mendes", pendente: 3200, revenue: 3200 },
    { nome: "Maria Costa", pendente: 1800, revenue: 4500 },
  ],
  destaques: [
    "3 casos novos captados na semana",
    "10/12 consultas realizadas — taxa de 83%",
    "R$ 31.000 recebidos — melhor semana do mês",
  ],
  problemas: [
    "💳 Empresa XYZ Ltda: $6,500.00 em aberto",
    "💳 João Mendes: $3,200.00 em aberto",
    "2 consultas canceladas — verificar reagendamento",
  ],
  historico: [
    { semana: "17/03 — 23/03", fat: 35000, casos: 24 },
    { semana: "24/03 — 30/03", fat: 38500, casos: 26 },
    { semana: "31/03 — 06/04", fat: 40000, casos: 27 },
    { semana: "07/04 — 13/04", fat: 42500, casos: 28 },
  ],
};

// ── HELPERS ──────────────────────────────────────────────────
const fmt = (v) => `$${(v||0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
const parseMoney = (s) => parseFloat((s || "0").replace(/[^0-9.]/g, "")) || 0;

// ── CSV PARSER (respeita aspas) ───────────────────────────────
const parseCSVLine = (line) => {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim()); cur = "";
    } else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
};

const parseCSV = (text) => {
  const lines = text.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return null;
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
    return obj;
  });
};

// ── PROCESSADORES CSV ────────────────────────────────────────
const processarRelatorio = (rows) => {
  if (!rows || rows.length === 0) return null;
  const keys = Object.keys(rows[0]).map(k => k.toLowerCase());
  const has = (k) => keys.some(key => key.includes(k));

  if (has("customer name") || (has("customer") && has("paid amount"))) return processarClientes(rows);
  if (has("employee")) return processarEquipe(rows);
  if (has("jobs by") || has("completed week")) return processarHistorico(rows);
  return processarGenerico(rows);
};

const processarClientes = (rows) => {
  const clientesPendentes = [];
  let fatTotal = 0, pagoTotal = 0, osTotal = 0;
  let clientesAtivos = 0;

  rows.forEach(r => {
    const nome = r["customer name"] || r["Customer name"] || "";
    if (!nome || nome.toLowerCase() === "total") return;
    const revenue = parseMoney(r["job revenue"] || r["Job revenue"]);
    const pago = parseMoney(r["paid amount"] || r["Paid amount"]);
    const jobs = parseInt(r["job count"] || r["Job count"] || "1") || 1;
    const pendente = revenue - pago;

    fatTotal += revenue;
    pagoTotal += pago;
    osTotal += jobs;
    clientesAtivos++;

    if (pendente > 0.01) {
      clientesPendentes.push({ nome, revenue, pago, pendente, jobs });
    }
  });

  return {
    faturamento: { total: fatTotal, recebido: pagoTotal, pendente: fatTotal - pagoTotal },
    clientes: { ativos: clientesAtivos, novos: 0, retorno: 0 },
    casos: { total: osTotal, ativos: osTotal, encerrados: 0, novos: 0 },
    clientesPendentes,
  };
};

const processarEquipe = (rows) => {
  const equipe = [];
  let fatTotal = 0;

  rows.forEach(r => {
    const nome = r["employee"] || r["Employee"] || "";
    if (!nome || nome.toLowerCase() === "total") return;
    const faturado = parseMoney(r["job revenue"] || r["Job revenue"]);
    const casos = parseInt(r["job count"] || r["Job count"] || "0") || 0;
    fatTotal += faturado;
    equipe.push({ nome, casos, faturado, pendente: 0, horas: parseFloat(r["total on job hrs"] || "0") || 0 });
  });

  return {
    faturamento: { total: fatTotal, recebido: Math.round(fatTotal * 0.78), pendente: Math.round(fatTotal * 0.22) },
    equipe,
  };
};

const processarHistorico = (rows) => {
  const historico = [];
  rows.forEach(r => {
    const semana = Object.values(r)[0] || "";
    if (!semana || semana.toLowerCase() === "total") return;
    const fat = parseMoney(r["job revenue"] || r["Job revenue"]);
    const casos = parseInt(r["job count"] || r["Job count"] || "0") || 0;
    if (fat > 0 || casos > 0) historico.push({ semana: semana.replace(" - ", " — "), fat, casos });
  });
  return { historico };
};

const processarGenerico = (rows) => ({ clientes: { ativos: rows.length, novos: 0, retorno: 0 } });

// ── COMPONENTES UI ───────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{
    background: "linear-gradient(135deg, #0D1E30 0%, #091828 100%)",
    borderRadius: 14,
    padding: "18px 20px",
    border: "1px solid #1A3050",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    ...style
  }}>{children}</div>
);

const Metric = ({ icon, label, value, sub, color, big }) => (
  <Card>
    <div style={{ fontSize: 10, color: "#4A6A8A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
      {icon} {label}
    </div>
    <div style={{
      fontSize: big ? 22 : 20,
      fontWeight: 900,
      color: color || "#E8F0F8",
      letterSpacing: -0.5,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#4A6080", marginTop: 5 }}>{sub}</div>}
  </Card>
);

const Badge = ({ text, color }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 20,
    fontSize: 10, fontWeight: 700,
    background: (color || "#888") + "18",
    color: color || "#888",
    border: `1px solid ${(color || "#888")}33`
  }}>{text}</span>
);

const Ring = ({ value, size = 52, color }) => {
  const r = (size - 6) / 2, circ = 2 * Math.PI * r, off = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1A3050" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .8s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: 12, fontWeight: 800, fill: color }}>
        {value}%
      </text>
    </svg>
  );
};

const MiniBar = ({ data, color, height = 80 }) => {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ fontSize: 8, color: "#5A7A9A", fontWeight: 700 }}>
            {d.val >= 1000 ? `${Math.round(d.val/1000)}k` : d.val}
          </div>
          <div style={{
            width: "100%", borderRadius: 4,
            height: `${Math.max((d.val/max)*(height-24), 3)}px`,
            background: `linear-gradient(180deg, ${color}, ${color}55)`,
            transition: "height .6s ease"
          }} />
          <div style={{ fontSize: 7, color: "#3A5A7A", textAlign: "center" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

const Section = ({ icon, title, count, children }) => (
  <div style={{ marginTop: 26 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: "#C8D8E8", letterSpacing: 0.3, fontFamily: "'Georgia', serif" }}>{title}</span>
      {count != null && (
        <span style={{ fontSize: 10, color: "#4A6A8A", background: "#0D2040", padding: "2px 10px", borderRadius: 20, fontWeight: 700, border: "1px solid #1A3050" }}>
          {count}
        </span>
      )}
    </div>
    {children}
  </div>
);

// ── DROP ZONE ────────────────────────────────────────────────
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
            if (partial) newFiles.push({ name: file.name, rows: rows.length, type: ext, data: partial });
            else setError(`Não consegui interpretar ${file.name}.`);
          }
        } else {
          newFiles.push({ name: file.name, rows: "—", type: ext, data: null, note: "Exporte como CSV para leitura automática" });
        }
      } catch (e) { setError(`Erro ao ler ${file.name}`); }
    }

    setFiles(prev => [...prev, ...newFiles]);

    const merged = { ...DADOS_VAZIO, semana: new Date().toLocaleDateString("pt-BR"), fonte: "upload" };
    const allPartials = [...files, ...newFiles].filter(f => f.data).map(f => f.data);

    allPartials.forEach(p => {
      if (p.faturamento && p.faturamento.total > merged.faturamento.total) merged.faturamento = p.faturamento;
      if (p.casos && p.casos.total > merged.casos.total) merged.casos = p.casos;
      if (p.equipe && p.equipe.length > 0) merged.equipe = p.equipe;
      if (p.clientes && p.clientes.ativos > 0 && p.clientes.ativos < 500) merged.clientes = p.clientes;
      if (p.historico && p.historico.length > 0) merged.historico = p.historico;
      if (p.clientesPendentes && p.clientesPendentes.length > 0) merged.clientesPendentes = p.clientesPendentes;
    });

    const customerPartial = allPartials.find(p => p.clientesPendentes);
    if (customerPartial) merged.faturamento = customerPartial.faturamento;

    // Gerar destaques e problemas
    merged.destaques = [];
    merged.problemas = [];

    if (merged.casos.total > 0) {
      merged.destaques.push(`${merged.casos.total} casos/clientes ativos na semana`);
    }
    if (merged.faturamento.total > 0) {
      merged.destaques.push(`Faturamento: ${fmt(merged.faturamento.total)}`);
    }
    if (merged.consultas.realizadas > 0) {
      const taxa = pct(merged.consultas.realizadas, merged.consultas.agendadas);
      merged.destaques.push(`${merged.consultas.realizadas}/${merged.consultas.agendadas} consultas realizadas — ${taxa}%`);
    }

    // Clientes com pagamento pendente
    if (merged.clientesPendentes.length > 0) {
      merged.clientesPendentes
        .sort((a, b) => b.pendente - a.pendente)
        .forEach(c => {
          merged.problemas.push(`💳 ${c.nome}: ${fmt(c.pendente)} em aberto`);
        });
    } else if (merged.faturamento.pendente > 0) {
      merged.problemas.push(`${fmt(merged.faturamento.pendente)} em pagamentos pendentes`);
    }

    if (merged.consultas.canceladas > 0) {
      merged.problemas.push(`${merged.consultas.canceladas} consulta(s) cancelada(s) — verificar reagendamento`);
    }

    if (allPartials.length > 0) onData(merged);
    setLoading(false);
  };

  const onDrop = useCallback((e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }, [files]);

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? EMPRESA.accent : "#1A3050"}`,
          borderRadius: 16, padding: "36px 20px", textAlign: "center",
          background: drag ? EMPRESA.accent + "08" : "#050F1A",
          cursor: "pointer", transition: "all .3s", marginBottom: 16,
        }}>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.pdf,.txt" multiple
          style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        <div style={{ fontSize: 40, marginBottom: 8 }}>{loading ? "⏳" : drag ? "📥" : "📂"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: drag ? EMPRESA.accent : "#6A8AAA", marginBottom: 4 }}>
          {loading ? "Processando..." : "Arraste o relatório aqui"}
        </div>
        <div style={{ fontSize: 11, color: "#3A5A7A" }}>CSV de clientes, equipe ou relatório semanal</div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: EMPRESA.danger + "12", border: `1px solid ${EMPRESA.danger}33`, borderRadius: 10, fontSize: 12, color: EMPRESA.danger, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3A5A7A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Arquivos carregados</div>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#0D1E30", borderRadius: 8, marginBottom: 4, border: "1px solid #1A3050" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{f.data ? "✅" : "📎"}</span>
                <span style={{ fontSize: 12, color: "#C8D8E8", fontWeight: 600 }}>{f.name}</span>
                {f.data && <Badge text={`${f.rows} linhas`} color={EMPRESA.success} />}
              </div>
              {f.note && <span style={{ fontSize: 10, color: EMPRESA.warning }}>{f.note}</span>}
              {f.data && <Badge text="Processado ✓" color={EMPRESA.success} />}
            </div>
          ))}
        </div>
      )}

      {!dados.semana && files.length === 0 && (
        <button onClick={() => onData(DADOS_DEMO)} style={{
          width: "100%", padding: "12px", borderRadius: 10,
          border: `1px dashed ${EMPRESA.accent}44`,
          background: "transparent", color: EMPRESA.accent,
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          🎮 Carregar dados de demonstração
        </button>
      )}
    </div>
  );
};

// ── VISÃO DONO ───────────────────────────────────────────────
const VisaoDono = ({ dados }) => {
  const d = dados;
  const taxaCobranca = pct(d.faturamento.recebido, d.faturamento.total);

  return (
    <div>
      {/* Header semana */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 10, color: "#3A5A7A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Semana</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#E8F0F8", fontFamily: "'Georgia', serif" }}>{d.semana || "—"}</div>
        </div>
        <Badge text={d.fonte === "upload" ? "📊 Via relatório" : d.fonte === "demo" ? "🎮 Demo" : "Manual"} color={EMPRESA.accent} />
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <Metric icon="💰" label="Faturamento" value={fmt(d.faturamento.total)} sub={`${fmt(d.faturamento.pendente)} pendente`} color={EMPRESA.success} big />
        <Metric icon="⚖️" label="Casos Ativos" value={d.casos.total} sub={`${d.casos.novos} novos`} color={EMPRESA.accent2} />
        <Metric icon="📅" label="Consultas" value={`${d.consultas.realizadas}/${d.consultas.agendadas}`} sub={`${d.consultas.canceladas} canceladas`} color={EMPRESA.gold} />
        <Metric icon="👤" label="Clientes" value={d.clientes.ativos} sub={`${d.clientes.novos} novos · ${d.clientes.retorno} retorno`} color={EMPRESA.accent} />
        <Metric icon="✅" label="Cobrança" value={`${taxaCobranca}%`} sub={`${fmt(d.faturamento.recebido)} recebido`} color={taxaCobranca >= 80 ? EMPRESA.success : EMPRESA.warning} />
      </div>

      {/* Cobrar na Reunião */}
      {d.problemas.length > 0 && (
        <Section icon="🔴" title="COBRAR NA REUNIÃO" count={d.problemas.length}>
          <Card style={{ borderColor: EMPRESA.danger + "33", background: EMPRESA.danger + "06" }}>
            {d.problemas.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < d.problemas.length - 1 ? "1px solid #1A3050" : "none" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                <span style={{ fontSize: 13, color: "#D8C8B8", lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Destaques */}
      {d.destaques.length > 0 && (
        <Section icon="✅" title="Destaques da Semana" count={d.destaques.length}>
          <Card style={{ borderColor: EMPRESA.success + "33", background: EMPRESA.success + "06" }}>
            {d.destaques.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < d.destaques.length - 1 ? "1px solid #1A3050" : "none" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>
                <span style={{ fontSize: 13, color: "#B8D8C8", lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Performance Equipe */}
      {d.equipe.length > 0 && (
        <Section icon="👥" title="Performance da Equipe" count={d.equipe.length}>
          {d.equipe.map((t, i) => {
            const taxaT = pct(t.faturado, t.faturado + t.pendente);
            return (
              <Card key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#D8E4F0", fontFamily: "'Georgia', serif" }}>⚖️ {t.nome}</div>
                  <Ring value={taxaT || 100} size={50} color={EMPRESA.accent} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                  <div><div style={{ fontSize: 18, fontWeight: 800, color: EMPRESA.accent2 }}>{t.casos}</div><div style={{ fontSize: 9, color: "#3A5A7A" }}>Casos</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: EMPRESA.success }}>{fmt(t.faturado)}</div><div style={{ fontSize: 9, color: "#3A5A7A" }}>Faturado</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: t.pendente > 0 ? EMPRESA.warning : EMPRESA.success }}>{fmt(t.pendente)}</div><div style={{ fontSize: 9, color: "#3A5A7A" }}>Pendente</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 800, color: "#6A8AAA" }}>{t.horas}h</div><div style={{ fontSize: 9, color: "#3A5A7A" }}>Horas</div></div>
                </div>
              </Card>
            );
          })}
        </Section>
      )}

      {/* Evolução Semanal */}
      {d.historico.length > 0 && (
        <Section icon="📈" title="Evolução Semanal">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Card>
              <div style={{ fontSize: 10, color: "#3A5A7A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Faturamento</div>
              <MiniBar data={d.historico.map(h => ({ val: h.fat, label: h.semana.split("—")[0].trim() }))} color={EMPRESA.accent} />
            </Card>
            <Card>
              <div style={{ fontSize: 10, color: "#3A5A7A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Casos</div>
              <MiniBar data={d.historico.map(h => ({ val: h.casos, label: h.semana.split("—")[0].trim() }))} color={EMPRESA.success} />
            </Card>
          </div>
        </Section>
      )}
    </div>
  );
};

// ── VISÃO FUNCIONÁRIO ────────────────────────────────────────
const VisaoFuncionario = ({ dados, nome }) => {
  const primeiro = nome.split(" ")[0];
  const meus = dados.equipe.find(t => t.nome.includes(primeiro));

  return (
    <div>
      <div style={{ fontSize: 10, color: "#3A5A7A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Semana</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#E8F0F8", marginBottom: 20, fontFamily: "'Georgia', serif" }}>{dados.semana || "—"}</div>

      {meus ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Metric icon="⚖️" label="Meus Casos" value={meus.casos} color={EMPRESA.accent2} />
            <Metric icon="💰" label="Faturado" value={fmt(meus.faturado)} color={EMPRESA.success} />
            <Metric icon="⏳" label="Pendente" value={fmt(meus.pendente)} color={meus.pendente > 0 ? EMPRESA.warning : EMPRESA.success} />
          </div>

          <Section icon="⏱️" title="Horas na Semana">
            <Card>
              <div style={{ textAlign: "center", fontSize: 48, fontWeight: 900, color: EMPRESA.accent, fontFamily: "'Georgia', serif" }}>{meus.horas}h</div>
              <div style={{ textAlign: "center", fontSize: 12, color: "#4A6A8A", marginTop: 4 }}>horas registradas</div>
            </Card>
          </Section>
        </>
      ) : (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 14, color: "#6A8AAA" }}>Seus dados ainda não foram carregados</div>
          <div style={{ fontSize: 12, color: "#3A5A7A", marginTop: 8 }}>Aguarde o upload do relatório semanal</div>
        </Card>
      )}
    </div>
  );
};

// ── APP PRINCIPAL ────────────────────────────────────────────
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

  // ── TELA DE LOGIN ──
  if (!user) return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(145deg, #040C18, ${EMPRESA.cor}, #071A2E)`,
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      <div style={{ width: 340, textAlign: "center", padding: "0 20px" }}>
        {/* Logo / Título */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#E8F0F8", letterSpacing: -0.5, marginBottom: 4 }}>
            Salvador Law PA
          </div>
          <div style={{ width: 40, height: 2, background: EMPRESA.gold, margin: "10px auto" }} />
          <div style={{ fontSize: 12, color: "#3A5A7A", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Dashboard de Gestão
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={loginUser}
            onChange={e => { setLoginUser(e.target.value); setLoginErr(false); }}
            placeholder="Usuário"
            onKeyDown={e => e.key === "Enter" && doLogin()}
            style={{
              padding: "14px 18px", borderRadius: 10,
              border: `1px solid ${loginErr ? EMPRESA.danger : "#1A3050"}`,
              background: "#0A1828", color: "#E8F0F8", fontSize: 14,
              outline: "none", fontFamily: "inherit",
            }}
          />
          <input
            value={loginPass}
            onChange={e => { setLoginPass(e.target.value); setLoginErr(false); }}
            placeholder="Senha" type="password"
            onKeyDown={e => e.key === "Enter" && doLogin()}
            style={{
              padding: "14px 18px", borderRadius: 10,
              border: `1px solid ${loginErr ? EMPRESA.danger : "#1A3050"}`,
              background: "#0A1828", color: "#E8F0F8", fontSize: 14,
              outline: "none", fontFamily: "inherit",
            }}
          />
          <button onClick={doLogin} style={{
            padding: "14px", borderRadius: 10, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${EMPRESA.accent}, ${EMPRESA.cor2})`,
            color: "white", fontSize: 14, fontWeight: 800, fontFamily: "inherit",
          }}>
            Entrar
          </button>
        </div>

        {loginErr && <div style={{ color: EMPRESA.danger, fontSize: 12, marginTop: 12 }}>Usuário ou senha incorretos</div>}

        <div style={{ marginTop: 28, padding: 16, background: "#0A1828", borderRadius: 12, border: "1px solid #1A3050", textAlign: "left" }}>
          <div style={{ fontSize: 10, color: "#3A5A7A", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Acesso</div>
          <div style={{ fontSize: 11, color: "#4A6A8A", lineHeight: 1.8 }}>
            👑 larissa → Dono (visão completa)<br />
            💼 assistente → Funcionário
          </div>
        </div>
      </div>
    </div>
  );

  const isDono = user.papel === "dono";
  const badgeLabel = isDono ? "👑 Advogada — Sócia" : "💼 Assistente";

  return (
    <div style={{ minHeight: "100vh", background: "#060E1A", fontFamily: "system-ui, sans-serif", color: "#C8D8E8" }}>

      {/* Header */}
      <div style={{
        padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: EMPRESA.cor,
        borderBottom: `1px solid ${EMPRESA.accent}22`,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 20px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚖️</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#E8F0F8", letterSpacing: -0.3, fontFamily: "'Georgia', serif" }}>
              Salvador Law PA
            </div>
            <div style={{ fontSize: 10, color: "#3A5A7A", letterSpacing: 0.5 }}>Gestão Semanal</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#D8E4F0" }}>{user.nome}</div>
            <div style={{ fontSize: 10, color: EMPRESA.gold }}>{badgeLabel}</div>
          </div>
          <button onClick={() => { setUser(null); setLoginUser(""); setLoginPass(""); }} style={{
            padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${EMPRESA.danger}44`,
            background: "transparent", color: EMPRESA.danger,
            fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>
            Sair
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Tabs */}
        {isDono && (
          <div style={{ display: "flex", gap: 4, padding: 4, background: "#0A1828", borderRadius: 12, marginBottom: 20, border: "1px solid #1A3050" }}>
            {[
              { id: "dashboard", icon: "📊", label: "Dashboard" },
              { id: "upload", icon: "📥", label: "Atualizar Dados" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "10px 8px", borderRadius: 10, border: "none",
                background: tab === t.id ? EMPRESA.accent + "22" : "transparent",
                color: tab === t.id ? EMPRESA.accent : "#3A5A7A",
                fontWeight: 800, fontSize: 12, cursor: "pointer",
                borderBottom: tab === t.id ? `2px solid ${EMPRESA.accent}` : "2px solid transparent",
                fontFamily: "inherit",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo */}
        {isDono && tab === "upload" && <DropZone onData={setDados} dados={dados} />}

        {isDono && tab === "dashboard" && (
          dados.semana
            ? <VisaoDono dados={dados} />
            : (
              <Card style={{ textAlign: "center", padding: 50 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#6A8AAA", marginBottom: 8, fontFamily: "'Georgia', serif" }}>
                  Nenhum relatório carregado
                </div>
                <div style={{ fontSize: 13, color: "#3A5A7A", marginBottom: 20 }}>
                  Vá em "Atualizar Dados" e arraste o relatório da semana
                </div>
                <button onClick={() => setTab("upload")} style={{
                  padding: "12px 28px", borderRadius: 10, border: "none",
                  background: EMPRESA.accent, color: "white",
                  fontWeight: 700, cursor: "pointer", fontSize: 13,
                }}>
                  📥 Ir para Upload
                </button>
              </Card>
            )
        )}

        {!isDono && <VisaoFuncionario dados={dados} nome={user.nome} />}
      </div>
    </div>
  );
}
