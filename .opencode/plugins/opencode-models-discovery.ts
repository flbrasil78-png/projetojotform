import { tool } from "@opencode-ai/plugin"

const models = {
  anthropic: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", family: "claude", context: 200000, reasoning: true, tool_call: true, attachment: true, cost: { input: 3, output: 15 } },
    { id: "claude-sonnet-4", name: "Claude Sonnet 4", family: "claude", context: 200000, reasoning: true, tool_call: true, attachment: true, cost: { input: 3, output: 15 } },
    { id: "claude-haiku-3-5", name: "Claude Haiku 3.5", family: "claude", context: 200000, reasoning: false, tool_call: true, attachment: true, cost: { input: 0.8, output: 4 } },
    { id: "claude-opus-4", name: "Claude Opus 4", family: "claude", context: 200000, reasoning: true, tool_call: true, attachment: true, cost: { input: 15, output: 75 } },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", family: "gpt", context: 128000, reasoning: false, tool_call: true, attachment: true, cost: { input: 2.5, output: 10 } },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", family: "gpt", context: 128000, reasoning: false, tool_call: true, attachment: true, cost: { input: 0.15, output: 0.6 } },
    { id: "o3", name: "o3", family: "o", context: 200000, reasoning: true, tool_call: true, attachment: true, cost: { input: 10, output: 40 } },
    { id: "o4-mini", name: "o4 Mini", family: "o", context: 200000, reasoning: true, tool_call: true, attachment: true, cost: { input: 1.1, output: 4.4 } },
  ],
  google: [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", family: "gemini", context: 1048576, reasoning: true, tool_call: true, attachment: true, cost: { input: 1.25, output: 10 } },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", family: "gemini", context: 1048576, reasoning: true, tool_call: true, attachment: true, cost: { input: 0.15, output: 0.6 } },
  ],
  meta: [
    { id: "llama-4-scout", name: "Llama 4 Scout", family: "llama", context: 256000, reasoning: false, tool_call: true, attachment: true, cost: { input: 0.15, output: 0.6 } },
    { id: "llama-4-maverick", name: "Llama 4 Maverick", family: "llama", context: 256000, reasoning: false, tool_call: true, attachment: true, cost: { input: 0.2, output: 0.6 } },
  ],
  deepseek: [
    { id: "deepseek-chat", name: "DeepSeek V3", family: "deepseek", context: 128000, reasoning: false, tool_call: true, attachment: false, cost: { input: 0.27, output: 1.1 } },
    { id: "deepseek-reasoner", name: "DeepSeek R1", family: "deepseek", context: 128000, reasoning: true, tool_call: false, attachment: false, cost: { input: 0.55, output: 2.19 } },
  ],
  amazon: [
    { id: "nova-pro", name: "Nova Pro", family: "nova", context: 300000, reasoning: false, tool_call: true, attachment: true, cost: { input: 0.8, output: 3.2 } },
  ],
  mistral: [
    { id: "mistral-large", name: "Mistral Large", family: "mistral", context: 128000, reasoning: false, tool_call: true, attachment: true, cost: { input: 2, output: 6 } },
  ],
  xai: [
    { id: "grok-3", name: "Grok 3", family: "grok", context: 131072, reasoning: true, tool_call: true, attachment: true, cost: { input: 3, output: 15 } },
  ],
}

export const models_discovery = tool({
  description: "Consulta o catálogo de modelos de IA disponíveis. Útil para descobrir qual modelo usar, comparar capacidades (contexto, preço, suporte a ferramentas), ou encontrar o ID correto para configurar opencode.json.",
  args: {
    provider: tool.schema.string().optional().describe("Filtrar por provedor: anthropic, openai, google, meta, deepseek, amazon, mistral, xai"),
    capability: tool.schema.string().optional().describe("Filtrar por capacidade: reasoning, tool_call, attachment"),
    min_context: tool.schema.number().optional().describe("Contexto mínimo em tokens"),
    search: tool.schema.string().optional().describe("Texto para buscar no nome ou ID do modelo"),
  },
  async execute(args) {
    let results = Object.entries(models).flatMap(([provider, providerModels]) =>
      providerModels.map((m) => ({ provider, ...m }))
    )

    if (args.provider) {
      results = results.filter((m) => m.provider === args.provider)
    }
    if (args.capability) {
      results = results.filter((m) => m[args.capability as keyof typeof m] === true)
    }
    if (args.min_context) {
      results = results.filter((m) => m.context >= args.min_context!)
    }
    if (args.search) {
      const q = args.search.toLowerCase()
      results = results.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
    }

    if (results.length === 0) {
      return "Nenhum modelo encontrado com os filtros fornecidos."
    }

    const lines = results.map((m) => {
      const caps = [
        m.reasoning ? "🧠 reasoning" : null,
        m.tool_call ? "🔧 tool_call" : null,
        m.attachment ? "📎 attachment" : null,
      ].filter(Boolean).join(", ")
      return [
        `[${m.provider}] ${m.name} (${m.id})`,
        `  Contexto: ${(m.context / 1000).toFixed(0)}K tokens | Custo: $${m.cost.input}/$${m.cost.output} por M tokens`,
        `  Capacidades: ${caps || "—"}`,
      ].join("\n")
    })

    return lines.join("\n\n")
  },
})

export default async () => {
  return {
    tool: {
      models_discovery,
    },
  }
}
