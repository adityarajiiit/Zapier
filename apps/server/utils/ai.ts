import { prisma } from '@repo/prisma'

export const fields: Record<string, { label: string }> = {
    spreadsheetId: {
        label: 'Spreadsheet ID'
    },
    databaseId: {
        label: 'Notion Database ID'
    },
    parentId: {
        label: 'Notion Parent Page ID'
    },
    pageId: {
        label: 'Notion Page ID'
    },
    owner: {
        label: 'GitHub Repository Owner'
    },
    repo: {
        label: 'GitHub Repository Name'
    },
    sheetName: {
        label: 'Sheet Name'
    },
    channelId: {
        label: 'Slack Channel'
    },
    to: {
        label: 'Recipient Email'
    }
}

export const fetchIntegrations = async () => {
    return prisma.integration.findMany({
        where: {
            isEnabled: true
        },
        include: {
            triggers: true,
            actions: true
        }
    })
}

export const getAll = (integrations: any) => {
    const lines: string[] = []
    lines.push('=== AVAILABLE TRIGGERS ===')
    for (const i of integrations) {
        for (const j of i.triggers) {
            lines.push(
                `triggerId: ${j.id} | integration: ${i.name} | name: ${j.name}` + (j.description ? ` | ${j.description}` : '')
            )
            const outSchema = j.outputSchema as any
            if (outSchema?.properties) {
                lines.push('  Trigger output fields (use as {{trigger.FIELD}}):')
                for (const [k, d] of Object.entries<any>(outSchema.properties)) {
                    lines.push(`    - {{trigger.${k}}} (${(d as any)?.type || 'string'})`)
                }
            }
        }
    }
    lines.push('')
    lines.push('=== AVAILABLE ACTIONS ===')
    for (const i of integrations) {
        for (const j of i.actions) {
            lines.push(
                `actionId: ${j.id} | integration: ${i.name} | name: ${j.name}` + (j.description ? ` | ${j.description}` : '')
            )
            const inSchema = j.inputSchema as any
            if (inSchema) {
                lines.push('  Input fields:')
                for (const [k, d] of Object.entries<any>(inSchema)) {
                    const isReqId = k in fields
                    lines.push(
                        `    - ${k} (${d?.type || 'string'}${isReqId ? ' , RESOURCE ID' : ''}): ${d?.description || ''}` +
                        (isReqId ? ' → write {{required}} if user did not provide this value' : '')
                    )
                }
            }
            const outSchema = j.outputSchema as any
            if (outSchema?.properties) {
                lines.push('  Output fields (use as {{stepN.FIELD}} in later steps):')
                for (const [k, d] of Object.entries<any>(outSchema.properties)) {
                    lines.push(`    - {{stepN.${k}}} (${(d as any)?.type || 'string'})`)
                }
            }
        }
    }
    return lines.join('\n')
}

export const buildSystemPrompt = (all: string) => {
    return `You are a workflow automation assistant. Given a user's automation request, generate a structured workflow JSON.

${all}

RULES:
1. Only use triggerId and actionId values listed above — never invent IDs.
2. Steps are 0-indexed. To reference a previous step's output use the EXACT field names listed under "Output fields" for that action. Example: if step 0 is gemini-summarize which outputs {{stepN.text}}, write {{step0.text}} — never write {{step0.propertyName}}.
3. To reference trigger output fields use the EXACT field names listed under "Trigger output fields". Example: {{trigger.title}}, {{trigger.body}}, {{trigger.number}}.
4. For any field marked RESOURCE ID that the user did not specify, write exactly "{{required}}" as the value.
5. For optional fields the user has not mentioned, omit the field entirely from the input object.
6. Infer meaningful step names from context (e.g. "Summarize Issue with Gemini", "Notify Slack Channel").
7. Respond with ONLY valid JSON — no markdown fences, no explanation, no comments.
8. If no trigger is applicable for the automation (e.g. the user only describes actions), omit the trigger field entirely.

OUTPUT JSON SCHEMA:
{
  "name": "<workflow name>",
  "description": "<short description>",
  "trigger": {
    "triggerId": "<triggerId from AVAILABLE TRIGGERS>",
    "config": {}
  },
  "steps": [
    {
      "actionId": "<actionId from AVAILABLE ACTIONS>",
      "name": "<step name>",
      "input": {
        "<fieldKey>": "<literal value | {{required}} | {{stepN.exactFieldName}} | {{trigger.exactFieldName}}"
      }
    }
  ]
}`
}

export const callGemini = async (userPrompt: string, prompt: string) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('gemini api key not found')
    }
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    role: 'user',
                    parts: [{ text: prompt }]
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: userPrompt }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.2
                }
            })
        }
    )

    if (!res.ok) {
        throw new Error(`${res.status}:${await res.text()}`)
    }

    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}