// Cloudflare Pages Function
// Rota automática: /api/leads

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

  if (!name || !phone || !plan || !Number.isFinite(score)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Gera o timestamp ISO atual para garantir que nunca fique nulo no D1
  const now = new Date().toISOString();

  const result = await env.DB
    .prepare(
      "INSERT INTO leads (name, phone, score, plan, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(name, phone, score, plan, now)
    .first();

  return Response.json(result, { status: 201 });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const adminCode = env.ADMIN_CODE || "2026";
  if (code !== adminCode) {
    return Response.json({ error: "Código incorreto." }, { status: 401 });
  }

  const { results } = await env.DB
    .prepare("SELECT * FROM leads ORDER BY id DESC")
    .all();

  const formatted = results.map((row) => {
    let formattedDate = "Sem data";
    
    if (row.created_at) {
      const parsed = new Date(row.created_at);
      if (!isNaN(parsed.getTime())) {
        formattedDate = parsed.toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
      } else {
        formattedDate = row.created_at;
      }
    }

    return {
      ...row,
      createdAt: formattedDate,
      created_at: formattedDate
    };
  });

  return Response.json(formatted);
}
