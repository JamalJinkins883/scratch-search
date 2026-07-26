export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing target URL parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };

  try {
    // 1. Primary Fetch Attempt
    let response = await fetch(targetUrl, { headers: defaultHeaders });

    // 2. Fallback to CORS Gateway if Scratch API blocks Cloudflare IP (403/429)
    if (!response.ok && targetUrl.includes('api.scratch.mit.edu')) {
      const fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      response = await fetch(fallbackUrl, { headers: defaultHeaders });
    }

    const data = await response.arrayBuffer();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 's-maxage=60, max-age=60'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: err.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
