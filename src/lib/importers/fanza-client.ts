const API_URL = 'https://api.dmm.com/affiliate/v3/ItemList';

export async function fetchFanzaItems(): Promise<unknown> {
  const apiId = process.env.FANZA_API_ID;
  const affiliateId = process.env.FANZA_AFFILIATE_ID;

  if (!apiId || !affiliateId) {
    throw new Error('FANZA APIの認証情報が未設定です');
  }

  const url = new URL(API_URL);

  const params = {
    api_id: apiId,
    affiliate_id: affiliateId,
    site: 'FANZA',
    service: 'digital',
    floor: 'videoa',
    hits: '10',
    output: 'json',
  };

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('FANZA API通信が15秒でタイムアウトしました');
    }

    throw new Error('FANZA APIへの接続に失敗しました');
  }

  if (!response.ok) {
    const status = response.status;

    if (status === 401 || status === 403) {
      throw new Error(`FANZA API認証・権限エラー: HTTP ${status}`);
    }

    if (status === 429) {
      throw new Error('FANZA APIのアクセス制限に達しました: HTTP 429');
    }

    if (status >= 500 && status <= 599) {
      throw new Error(`FANZA APIサーバーエラー: HTTP ${status}`);
    }

    throw new Error(`FANZA API HTTP error: ${status}`);
  }

  try {
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('FANZA APIレスポンスの読み込みがタイムアウトしました');
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('FANZA APIレスポンスの読み込みが中断されました');
    }

    throw new Error('FANZA APIレスポンスのJSON解析に失敗しました');
  }
}
