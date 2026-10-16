// FANZA（DMM）女優検索APIの取得と、DB用の形への変換。
const API_URL = 'https://api.dmm.com/affiliate/v3/ActressSearch';

export type ActressProfile = {
  ruby: string | null;
  imageUrl: string | null;
  cup: string | null;
  bust: number | null;
  waist: number | null;
  hip: number | null;
  height: number | null;
  birthday: string | null;
  bloodType: string | null;
  hobby: string | null;
  prefectures: string | null;
};

type RawActress = {
  id?: string | number;
  name?: string;
  ruby?: string;
  bust?: string | number;
  cup?: string;
  waist?: string | number;
  hip?: string | number;
  height?: string | number;
  birthday?: string;
  blood_type?: string;
  hobby?: string;
  prefectures?: string;
  imageURL?: { small?: string; large?: string };
};

function text(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v.slice(0, max) : null;
}

function size(value: unknown, min: number, max: number): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.replace(/^http:\/\//, 'https://'));
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !(host === 'dmm.co.jp' || host.endsWith('.dmm.co.jp'))) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function mapFanzaActress(raw: RawActress): ActressProfile {
  const birthday = text(raw.birthday, 10);

  return {
    ruby: text(raw.ruby, 100),
    imageUrl: imageUrl(raw.imageURL?.large) ?? imageUrl(raw.imageURL?.small),
    cup: text(raw.cup, 3),
    bust: size(raw.bust, 50, 200),
    waist: size(raw.waist, 30, 200),
    hip: size(raw.hip, 50, 200),
    height: size(raw.height, 100, 220),
    birthday: birthday && /^\d{4}-\d{2}-\d{2}$/.test(birthday) ? birthday : null,
    bloodType: text(raw.blood_type, 5),
    hobby: text(raw.hobby, 200),
    prefectures: text(raw.prefectures, 50),
  };
}

// 女優ID（例: 15365）で1人分を取得する。見つからなければ null。
export async function fetchFanzaActress(actressId: string): Promise<RawActress | null> {
  const apiId = process.env.FANZA_API_ID;
  const affiliateId = process.env.FANZA_AFFILIATE_ID;

  if (!apiId || !affiliateId) {
    throw new Error('FANZA APIの認証情報が未設定です');
  }
  if (!/^\d{1,10}$/.test(actressId)) {
    throw new Error('女優IDの形式が正しくありません');
  }

  const url = new URL(API_URL);
  url.searchParams.set('api_id', apiId);
  url.searchParams.set('affiliate_id', affiliateId);
  url.searchParams.set('actress_id', actressId);
  url.searchParams.set('hits', '1');
  url.searchParams.set('output', 'json');

  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });

  if (response.status === 429) throw new Error('FANZA APIのアクセス制限に達しました: HTTP 429');
  if (!response.ok) throw new Error(`FANZA API HTTP error: ${response.status}`);

  const data = (await response.json()) as { result?: { actress?: RawActress[] } };
  const list = data?.result?.actress;
  return Array.isArray(list) && list.length > 0 ? list[0] : null;
}
