# Assistente de Escrita Gemini + JotForm

Backend proxy + script de injeção para adicionar um assistente de escrita com IA (Google Gemini) dentro de formulários JotForm.

## Estrutura

```
projeto/
├── backend/
│   ├── server.js        Servidor Express (proxy Gemini)
│   ├── .env.example     Template de configuração
│   └── package.json
└── public/
    ├── index.html        Página de teste + instruções
    └── jotform-assistant.js  Script injetável no JotForm
```

## Como usar

### 1. Configurar o backend

```bash
cd backend
cp .env.example .env
```

Edite `.env` e coloque sua chave da Gemini:
```
GEMINI_API_KEY=sua-chave-aqui
PORT=3000
ALLOWED_ORIGINS=*
```

### 2. Rodar localmente (teste)

```bash
cd backend
npm start
```

Acesse http://localhost:3000 para testar.

### 3. Publicar no Render (gratuito)

1. Crie uma conta em [render.com](https://render.com) (GitHub)
2. Crie um repositório no GitHub e faça push do projeto
3. No Render: **New + → Web Service → Connect your GitHub repo**
4. Configure:

   | Campo | Valor |
   |-------|-------|
   | Root Directory | `backend` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Plan | **Free** |

5. Em **Environment Variables**, adicione:
   - `GEMINI_API_KEY` = sua chave da Gemini (gratuita em [aistudio.google.com](https://aistudio.google.com/apikey))

6. Clique em **Deploy**

Pronto! O Render gera uma URL tipo `https://jotform-gemini-assistant.onrender.com`

> **Dica:** No free tier o servidor "dorme" após 15 min sem uso. A primeira requisição após um período ocioso pode levar alguns segundos.

### 4. Integrar no JotForm

1. No JotForm, edite seu formulário
2. Vá em **Settings → Form Settings → Advanced → Customize Form Layout**
3. Em **Custom Footer**, cole o código abaixo
4. Substitua `https://SEU-SERVIDOR.com` pela URL do seu backend

```html
<script>
  window.JF_Gemini_Config = {
    apiUrl: "https://SEU-SERVIDOR.onrender.com/api/polish",
    tone: "professional"
  }
</script>
<script src="https://SEU-SERVIDOR.onrender.com/jotform-assistant.js"></script>
```

5. Salve e publique o formulário

### 5. Usar

- Preencha um campo de texto no formulário
- Clique no botão verde **"Melhorar"** ao lado do campo
- O texto será revisado e substituído automaticamente

## Personalização

### Tom do texto

No `window.JF_ChatGPT_Config`, altere `tone` para:

| Valor | Efeito |
|-------|--------|
| `professional` | Tom profissional e formal (padrão) |
| `friendly` | Tom amigável e acessível |
| `formal` | Linguagem formal e respeitosa |
| `concise` | Versão concisa e direta |

### Modelo Gemini

Em `backend/server.js`, altere `model` em `genAI.getGenerativeModel`:
- `gemini-2.0-flash` (padrão, rápido e gratuito)
- `gemini-1.5-flash` (alternativa gratuita)
- `gemini-2.5-flash` (mais recente, gratuito)

## Segurança

- A chave da Gemini fica apenas no servidor
- O script frontend NÃO expõe a chave
- Limite de texto: 10.000 caracteres
- Validação de entrada no servidor

## API

### POST /api/polish

```json
{
  "text": "Texto para revisar com erros",
  "tone": "professional",
  "context": "Nome do campo (opcional)"
}
```

### GET /api/health

Retorna o status do servidor e se a API key está configurada.
