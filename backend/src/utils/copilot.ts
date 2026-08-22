import { approveAll, CopilotClient } from '@github/copilot-sdk'

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return fenced?.[1]?.trim() ?? text.trim()
}

export async function runCopilotJson<T>(prompt: string): Promise<T | null> {
  if (process.env.COPILOT_SDK_ENABLED !== 'true') {
    return null
  }

  const client = new CopilotClient()
  let response = ''

  try {
    await client.start()

    const session = await client.createSession({
      model: process.env.COPILOT_MODEL ?? 'gpt-5-mini',
      onPermissionRequest: approveAll,
    })

    const idle = new Promise<void>((resolve) => {
      session.on('assistant.message', (event: any) => {
        const content = event?.data?.content

        if (typeof content === 'string') {
          response += content
          return
        }

        if (Array.isArray(content)) {
          response += content
            .map((entry) => {
              if (typeof entry === 'string') {
                return entry
              }

              if (entry && typeof entry === 'object' && 'text' in entry) {
                return String(entry.text)
              }

              return ''
            })
            .join('')
        }
      })

      session.on('session.idle', () => resolve())
    })

    await session.send({ prompt })
    await idle
    await session.disconnect()

    return JSON.parse(extractJsonBlock(response)) as T
  } catch {
    return null
  } finally {
    await client.stop().catch(() => undefined)
  }
}
