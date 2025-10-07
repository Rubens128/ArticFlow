export type ChatMsg = { role: "user"| "assistant" | "system"; content: string};

export async function askAI(message: string, history:ChatMsg[] = [], { temperature = 0.2, max_tokens = 512 } = {}) {
  
    const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history, temperature, max_tokens })
        })
  
    if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Falha no /ai/chat (${res.status}): ${txt}`)
    }

  return res.json()
}