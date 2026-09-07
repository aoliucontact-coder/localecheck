import { env } from 'cloudflare:workers';
import {
  PROMPT_VERSION,
  buildReviewMessages,
  parseReviewResponse,
  parseProviderUsage,
  readBoundedText,
  validateReviewRequest,
} from '@/lib/ai-review.mjs';
export async function POST(request: Request) {
  const config = env as unknown as Record<string, string | undefined>;
  if (!config.LLM_API_KEY || !config.LLM_API_URL || !config.LLM_MODEL)
    return Response.json(
      {
        error:
          'AI 审校尚未启用：需要配置模型服务。你仍可使用规则检查、人工修改和导出。',
      },
      { status: 503 },
    );
  try {
    if (Number(request.headers.get('content-length') || 0) > 1_000_000)
      return Response.json({ error: '请求过大。' }, { status: 413 });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 1_000_000)
      return Response.json({ error: '请求过大。' }, { status: 413 });
    let data;
    try {
      data = validateReviewRequest(JSON.parse(raw));
    } catch (error) {
      return Response.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }
    const upstream = new URL(config.LLM_API_URL);
    if (upstream.protocol !== 'https:')
      return Response.json(
        { error: '模型服务配置需使用 HTTPS。' },
        { status: 503 },
      );
    const startedAt = Date.now();
    const response = await fetch(upstream, {
      method: 'POST',
      signal: AbortSignal.timeout(45000),
      headers: {
        Authorization: `Bearer ${config.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        messages: buildReviewMessages(data),
      }),
    });
    if (!response.ok)
      return Response.json(
        { error: '模型服务暂时不可用，请稍后重试。当前文案与确认记录已保留。' },
        { status: 502 },
      );
    const result = JSON.parse(await readBoundedText(response)) as {
      choices?: { message?: { content?: string } }[];
      usage?: unknown;
    };
    const content = result.choices?.[0]?.message?.content || '';
    const ids = new Set(data.rows.map((r) => r.id));
    const issues = parseReviewResponse(content, ids, {
      model: config.LLM_MODEL,
    });
    return Response.json({
      issues,
      review: {
        model: config.LLM_MODEL,
        promptVersion: PROMPT_VERSION,
        durationMs: Date.now() - startedAt,
        issueCount: issues.length,
        usage: parseProviderUsage(result.usage),
      },
    });
  } catch {
    return Response.json(
      {
        error: '未能获得有效的 AI 审校结果，请重试。当前文案与确认记录已保留。',
      },
      { status: 502 },
    );
  }
}
