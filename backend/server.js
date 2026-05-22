import "dotenv/config"
import express from "express"
import cors from "cors"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 3000

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

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

    const systemPrompt = `Você é um assistente de escrita especializado em revisar e melhorar textos em português brasileiro.

${toneInstruction}

Regras:
- Corrija erros gramaticais, ortográficos e de pontuação
- Melhore a clareza e fluidez do texto
- Preserve o significado original e as informações
- NÃO adicione informações novas que não estavam no texto original
- NÃO use linguagem rebuscada desnecessariamente
- Retorno APENAS o texto revisado, sem explicações, comentários ou formatação extra
- Mantenha parágrafos e estrutura original`

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    })

    const userContent = context
      ? `Contexto do formulário: ${context}\n\nTexto para revisar:\n${text}`
      : `Texto para revisar:\n${text}`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        maxOutputTokens: Math.min(text.length * 2, 16000),
        temperature: 0.3,
      },
    })

    const polished = result.response.text().trim()

    res.json({
      original: text,
      polished,
      model: "gemini-2.5-flash",
      usage: null,
    })
  } catch (err) {
    console.error("Erro Gemini:", err)

    if (err.message?.includes("API_KEY")) {
      return res.status(500).json({ error: "Erro de autenticação com Gemini. Verifique sua API key." })
    }
    if (err.status === 429 || err.message?.includes("quota") || err.message?.includes("RATE_LIMIT")) {
      return res.status(429).json({ error: "Limite de requisições excedido. Tente novamente em instantes." })
    }

    res.status(500).json({ error: "Erro ao processar texto. Tente novamente." })
  }
})

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", apiKey: !!process.env.GEMINI_API_KEY })
})

app.use(express.static(join(__dirname, "public")))

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
  console.log(`API Key configurada: ${!!process.env.GEMINI_API_KEY}`)
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
