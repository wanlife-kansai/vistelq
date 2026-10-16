const apiId = process.env.FANZA_API_ID ?? '';
const aff = process.env.FANZA_AFFILIATE_ID ?? '';

function shape(name: string, v: string) {
  console.log(
    `${name}: 長さ=${v.length} 前後の空白=${v !== v.trim()} 引用符=${/["']/.test(v)} 改行=${/[\r\n]/.test(v)}`
  );
}
shape('FANZA_API_ID', apiId);
shape('FANZA_AFFILIATE_ID', aff);
console.log(`アフィリエイトIDの形式OK(navimedia-990〜999): ${/^navimedia-99\d$/.test(aff)}`);
console.log(`アフィリエイトID: ${aff}`);

async function main() {
  const url = new URL('https://api.dmm.com/affiliate/v3/ItemList');
  url.searchParams.set('api_id', apiId.trim());
  url.searchParams.set('affiliate_id', aff.trim());
  url.searchParams.set('site', 'FANZA');
  url.searchParams.set('service', 'digital');
  url.searchParams.set('floor', 'videoa');
  url.searchParams.set('hits', '1');
  url.searchParams.set('output', 'json');
  const res = await fetch(url);
  const text = await res.text();
  console.log(`HTTP ${res.status}`);
  console.log(text.slice(0, 300));
}
main();
