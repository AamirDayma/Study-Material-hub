import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

type RequestBody = {
  notes?: string
  mcqCount?: number
  theoryCount?: number
  difficulty?: string
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders })

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405)

  const apiKey = Deno.env.get("GEMINI_API_KEY")
  if (!apiKey) return jsonResponse({ error: "Gemini is not configured" }, 500)

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : ""
  const mcqCount = Math.max(0, Math.min(20, Number(body.mcqCount) || 0))
  const theoryCount = Math.max(0, Math.min(10, Number(body.theoryCount) || 0))
  const difficulty = typeof body.difficulty === "string" ? body.difficulty : "medium"

  if (!notes || (mcqCount === 0 && theoryCount === 0)) {
    return jsonResponse({ error: "Notes and at least one question count are required" }, 400)
  }

  const prompt = `You are an expert educational assessment writer. Using only the notes below, generate exactly ${mcqCount} multiple-choice questions and exactly ${theoryCount} theory questions at ${difficulty} difficulty.

Return valid JSON only with this exact shape:
{"mcqs":[{"prompt":"...","options":["...","...","...","..."],"answer":"...","type":"mcq"}],"theories":[{"prompt":"...","type":"theory"}]}

For every MCQ, include exactly four options and set answer to the exact correct option text. Do not include markdown or extra keys.

NOTES:
${notes}`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    })

    if (!response.ok) {
      console.error("Gemini request failed", response.status)
      return jsonResponse({ error: "Question generation failed" }, 502)
    }

    const result = await response.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== "string") return jsonResponse({ error: "Gemini returned no questions" }, 502)

    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim())
    return jsonResponse({
      mcqs: Array.isArray(parsed.mcqs) ? parsed.mcqs : [],
      theories: Array.isArray(parsed.theories) ? parsed.theories : [],
    })
  } catch (error) {
    console.error("Question generation error", error)
    return jsonResponse({ error: "Question generation failed" }, 500)
  }
})
