export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/leads") {
      if (request.method === "POST") return handlePost(request, env);
      if (request.method === "GET") return handleGet(request, env);
      return new Response("Method not allowed", { status: 405 });
    }

    // Qualquer outra rota: serve o site estático normalmente
    return env.ASSETS.fetch(request);
  },
};

async function handlePost(request, env) {
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

  const result = await env.DB
    .prepare("INSERT INTO leads (name, phone, score, plan) VALUES (?, ?, ?, ?) RETURNING *")
    .bind(name, phone, score, plan)
    .first();

  return Response.json(result, { status: 201 });
}

async function handleGet(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const adminCode = env.ADMIN_CODE || "2026";

  if (code !== adminCode) {
    return Response.json({ error: "Código incorreto." }, { status: 401 });
  }

  const { results } = await env.DB
    .prepare("SELECT * FROM leads ORDER BY created_at DESC")
    .all();

  const formatted = results.map((row) => ({
    ...row,
    created_at: new Date(row.created_at + "Z").toLocaleString("pt-BR"),
  }));

  return Response.json(formatted);
}
