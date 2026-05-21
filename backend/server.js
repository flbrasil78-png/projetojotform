import "dotenv/config"
import express from "express"
import cors from "cors"
import OpenAI from "openai"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 3000

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS === "*" ? "*" : process.env.ALLOWED_ORIGINS?.split(","),
  methods: ["POST", "OPTIONS"],
}))

app.use(express.json({ limit: "100kb" }))

app.post("/api/polish", async (req, res) => {
  try {
    const { text, tone, context } = req.body

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Texto é obrigatório" })
    }

    if (text.length > 10000) {
      return res.status(400).json({ error: "Texto muito longo (máx 10000 caracteres)" })
    }

    const toneInstruction = toneOptions[tone] || toneOptions.professional

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um assistente de escrita especializado em revisar e melhorar textos em português brasileiro.

${toneInstruction}

Regras:
- Corrija erros gramaticais, ortográficos e de pontuação
- Melhore a clareza e fluidez do texto
- Preserve o significado original e as informações
- NÃO adicione informações novas que não estavam no texto original
- NÃO use linguagem rebuscada desnecessariamente
- Retorno APENAS o texto revisado, sem explicações, comentários ou formatação extra
- Mantenha parágrafos e estrutura original`,
        },
        {
          role: "user",
          content: context
            ? `Contexto do formulário: ${context}\n\nTexto para revisar:\n${text}`
            : `Texto para revisar:\n${text}`,
        },
      ],
      max_tokens: Math.min(text.length * 2, 16000),
      temperature: 0.3,
    })

    const polished = completion.choices[0]?.message?.content?.trim() || ""

    res.json({
      original: text,
      polished,
      model: completion.model,
      usage: completion.usage,
    })
  } catch (err) {
    console.error("Erro OpenAI:", err)

    if (err.status === 401) {
      return res.status(500).json({ error: "Erro de autenticação com OpenAI. Verifique sua API key." })
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Limite de requisições excedido. Tente novamente em instantes." })
    }

    res.status(500).json({ error: "Erro ao processar texto. Tente novamente." })
  }
})

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", apiKey: !!process.env.OPENAI_API_KEY })
})

app.use(express.static(join(__dirname, "public")))

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
  console.log(`API Key configurada: ${!!process.env.OPENAI_API_KEY}`)
})

const toneOptions = {
  professional: `- Mantenha um tom profissional e formal
- Prefira linguagem clara e objetiva`,
  friendly: `- Mantenha um tom amigável e acessível
- Use linguagem natural e acolhedora`,
  formal: `- Use linguagem formal e respeitosa
- Evite contrações e gírias`,
  concise: `- Seja conciso e direto
- Elimine redundâncias e palavras desnecessárias
- Mantenha apenas a informação essencial`,
}
