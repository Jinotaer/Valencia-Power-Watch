import express from "express"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config()

const app = express()
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.get("/api/users", async (req, res) => {
  const { role } = req.query
  const columns =
    role === "resident"
      ? "id, full_name, email, contact_number, address"
      : "id, full_name, email, contact_number, role"

  const { data, error } = await supabase
    .from("users")
    .select(columns)
    .eq("role", role)
    .order("created_at", { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ users: data ?? [] })
})

const port = process.env.PORT ?? 3001
app.listen(port, () => console.log(`API listening on :${port}`))
