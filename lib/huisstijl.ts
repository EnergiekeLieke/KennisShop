async function leesStream(res: Response): Promise<string> {
  if (!res.ok || !res.body) {
    const tekst = await res.text();
    let errMsg = `Analyse mislukt (${res.status})`;
    try { errMsg = JSON.parse(tekst).error || errMsg; } catch { errMsg = tekst.slice(0, 150) || errMsg; }
    throw new Error(errMsg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
  } catch (err) {
    reader.cancel();
    throw err;
  }
  return result;
}

export async function roepAnalyseAan(prompt: string, maxTokens = 2000, signal?: AbortSignal): Promise<string> {
  const res = await fetch('/api/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens }),
    signal,
  });
  return leesStream(res);
}

const KOMMA_WOORDEN = new Set([
  'maar', 'want', 'en', 'of', 'dus', 'toch', 'ook', 'zelfs',
  'soms', 'nog', 'al', 'dan', 'hoewel', 'terwijl',
]);

export function vervangMDashes(tekst: string): string {
  const zonderMDash = tekst.replace(/[ \t]*—[ \t]*/g, (match, offset: number, str: string) => {
    const na = str.slice(offset + match.length);
    const eersteChar = na[0] ?? '';
    const volgend = (na.match(/^([a-zA-Z]+)/)?.[1] ?? '').toLowerCase();
    if (eersteChar >= 'A' && eersteChar <= 'Z') return '. ';
    if (KOMMA_WOORDEN.has(volgend)) return ', ';
    return ': ';
  });
  // AI laat soms de spatie na ## of ### weg, waardoor koppen niet als kop herkend worden
  return zonderMDash.replace(/^(#{2,3})([^#\s])/gm, '$1 $2');
}
