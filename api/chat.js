/**
 * Vercel Serverless Function: /api/chat
 * Proxies LLM chat completion requests to forge.manus.ai server-side,
 * bypassing CORS restrictions on the client.
 * Uses BUILT_IN_FORGE_API_KEY (server-side key) for authentication.
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use server-side BUILT_IN_FORGE_API_KEY (works from server context)
  // Fall back to VITE_FRONTEND_FORGE_API_KEY for compatibility
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL
    || process.env.VITE_FRONTEND_FORGE_API_URL
    || 'https://forge.manus.ai';
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY
    || process.env.VITE_FRONTEND_FORGE_API_KEY;

  if (!forgeKey) {
    return res.status(500).json({ error: 'LLM API key not configured' });
  }

  try {
    const body = req.body;

    const response = await fetch(`${forgeUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${forgeKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('LLM proxy error:', err);
    return res.status(500).json({ error: 'Failed to reach LLM service' });
  }
}
