# ❄️ Arctic Cool AC — Dashboard Operacional

Dashboard premium com visão por perfil (Dono / Técnico / Atendimento).
Funciona como PWA — instala no celular como app.

---

## 🚀 PASSO A PASSO — Do zero ao link pro cliente

### 1. Criar conta (1 min)

- **GitHub**: https://github.com → crie uma conta grátis (se não tiver)
- **Vercel**: https://vercel.com → entre com a conta do GitHub

### 2. Subir o código no GitHub (2 min)

1. No GitHub, clique em **"New repository"** (botão verde)
2. Nome: `arctic-cool-dashboard` (ou o nome do cliente)
3. Marque **Private** (pra ninguém ver o código)
4. Clique em **"Create repository"**
5. Faça upload de TODOS os arquivos desta pasta:
   - Arraste a pasta inteira pra dentro do repositório
   - Ou use o botão "Upload files"
6. Clique em **"Commit changes"**

### 3. Deploy na Vercel (2 min)

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New... → Project"**
3. Selecione o repositório `arctic-cool-dashboard`
4. Framework: **Next.js** (detecta automaticamente)
5. Clique em **"Deploy"**
6. Aguarde ~1 minuto
7. Pronto! Você recebe um link tipo: `arctic-cool-dashboard.vercel.app`

### 4. Domínio personalizado (opcional)

Na Vercel, vá em Settings → Domains → adicione:
- `painel.arcticcool.com` (se o cliente tiver domínio próprio)
- Ou use o .vercel.app grátis mesmo

### 5. Instalar no celular como app (PWA)

**iPhone:**
1. Abra o link no Safari
2. Toque no botão de compartilhar (quadrado com seta)
3. Toque em "Adicionar à Tela de Início"
4. Pronto — ícone na home, abre em tela cheia

**Android:**
1. Abra o link no Chrome
2. Toque nos 3 pontinhos → "Instalar app" ou "Adicionar à tela inicial"
3. Pronto — funciona como app nativo

---

## 📁 Estrutura do Projeto

```
arctic-cool-dashboard/
├── public/
│   ├── manifest.json      ← Config do PWA (nome, cores, ícone)
│   ├── sw.js              ← Service Worker (funciona offline)
│   ├── icon-192.png       ← Ícone do app (192x192)
│   └── icon-512.png       ← Ícone do app (512x512)
├── src/app/
│   ├── layout.js          ← Layout + meta tags PWA
│   ├── globals.css        ← Estilos globais
│   └── page.js            ← ★ DASHBOARD COMPLETO ★
├── next.config.js
├── package.json
└── README.md
```

---

## ⚙️ Personalizar para outro cliente

### Arquivo: `src/app/page.js` — Mude 3 blocos:

**1) EMPRESA** (linha ~10):
```javascript
const EMPRESA = {
  nome: "Nome do Cliente",
  segmento: "Segmento",
  icon: "🏢",
  cor: "#0B1D3A",       // Cor principal
  accent: "#00B4D8",    // Cor destaque
  // ...
};
```

**2) USUARIOS** (linha ~22):
```javascript
const USUARIOS = {
  carlos: { senha: "senha123", papel: "dono", nome: "Carlos", avatar: "👑" },
  joao: { senha: "senha456", papel: "tecnico", nome: "João", avatar: "🔧" },
  // ...
};
```

**3) DADOS** (linha ~30):
```javascript
const DADOS = {
  osHoje: [...],       // OS / serviços do dia
  historico: [...],    // Faturamento mês a mês
  contratos: [...],    // PandaDoc
  tarefas: [...],      // Tarefas da equipe
  estoque: [...],      // Materiais
  leads: [...],        // Leads
  rotina: {...},       // Checklist
};
```

### Arquivo: `public/manifest.json` — Mude:
- `name`: Nome da empresa
- `short_name`: Nome curto
- `theme_color`: Cor principal

### Ícones:
- Substitua `icon-192.png` e `icon-512.png` com a logo do cliente

---

## 🔄 Atualizar dados

O cliente (ou você) edita o bloco DADOS no `page.js`.
Depois de commitar no GitHub, a Vercel atualiza automaticamente em ~30 segundos.

---

## 👥 Perfis e o que cada um vê

| Perfil | Vê | Não vê |
|--------|-----|--------|
| 👑 Dono | Tudo: faturamento, OS, contratos, leads, equipe, estoque, rotina | — |
| 🔧 Técnico | Suas OS, suas tarefas, estoque, checklist | Faturamento, leads, contratos, equipe inteira |
| 📞 Atendimento | OS do dia, leads, contratos, equipe, checklist | Faturamento detalhado |

---

## 📱 Funciona como app no celular

- ✅ Instala na tela inicial (PWA)
- ✅ Abre em tela cheia (sem barra do navegador)
- ✅ Ícone personalizado
- ✅ Funciona em qualquer celular (iPhone + Android)
- ✅ Responsivo (computador, tablet, celular)

---

## 💡 Modelo de negócio

1. Você configura o dashboard pro cliente (30-60 min)
2. Faz deploy na Vercel (5 min)
3. Envia o link + ensina a instalar no celular
4. Cliente alimenta os dados
5. Você dá manutenção quando precisar (cobra mensal ou por demanda)
