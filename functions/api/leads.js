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

  if (!name || !phone || !plan || !Number.isFinite(score)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    // Insere os dados de forma limpa usando a hora ISO atual do sistema
    const now = new Date().toISOString();
    const result = await env.DB
      .prepare("INSERT INTO leads (name, phone, score, plan, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(name, phone, score, plan, now)
      .run();

    return Response.json({ success: true, result }, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Erro ao salvar no banco", details: err.message }, { status: 500 });
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
    // Busca simples no banco
    const { results } = await env.DB
      .prepare("SELECT * FROM leads ORDER BY id DESC")
      .all();

    return Response.json(results || []);
  } catch (err) {
    // Retorna a mensagem exata do erro do banco se falhar em vez de tela branca
    return Response.json({ error: "Erro na consulta do banco", details: err.message }, { status: 500 });
  }
}
