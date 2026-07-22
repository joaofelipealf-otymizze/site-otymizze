// Cloudflare Pages Function
// Rota: /api/leads

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const plan = typeof body.plan === "string" ? body.plan.trim() : "";
  const score = Number(body.score);
  // Usa o timestamp em ms enviado pelo front; se ausente, gera um novo
  const createdAt = body.created_at ? String(body.created_at) : String(Date.now());

  if (!name || !phone || !plan || !Number.isFinite(score)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const result = await env.DB
      .prepare("INSERT INTO leads (name, phone, score, plan, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *")
      .bind(name, phone, score, plan, createdAt)
      .first();

    return Response.json(result, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Erro ao salvar lead", details: err.message }, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const adminCode = env.ADMIN_CODE || "2026";
  if (code !== adminCode) {
    return Response.json({ error: "Código incorreto." }, { status: 401 });
  }

  try {
    const { results } = await env.DB
      .prepare("SELECT id, name, phone, plan, score, created_at FROM leads ORDER BY id DESC")
      .all();

    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (err) {
    return Response.json({ error: "Erro na consulta do banco", details: err.message }, { status: 500 });
  }
}
