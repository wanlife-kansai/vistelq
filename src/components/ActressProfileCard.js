// 女優のプロフィール表示（画像＋身長・スリーサイズなど）。profile が空なら何も出さない。
export default function ActressProfileCard({ profile, headingLevel = 2 }) {
  if (!profile) return null;

  const Heading = `h${headingLevel}`;
  const sizes = [
    profile.bust ? `B${profile.bust}${profile.cup ? `(${profile.cup}カップ)` : ""}` : null,
    profile.waist ? `W${profile.waist}` : null,
    profile.hip ? `H${profile.hip}` : null,
  ].filter(Boolean);

  const rows = [
    ["身長", profile.height ? `${profile.height}cm` : null],
    ["スリーサイズ", sizes.length ? sizes.join(" / ") : null],
    ["生年月日", profile.birthday],
    ["出身地", profile.prefectures],
    ["血液型", profile.bloodType ? `${profile.bloodType}型` : null],
    ["趣味", profile.hobby],
  ].filter(([, value]) => value);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-zinc-900/80 p-6 sm:flex-row">
      {profile.imageUrl && (
        <img
          src={profile.imageUrl}
          alt={profile.name}
          loading="lazy"
          className="h-56 w-44 shrink-0 self-start rounded-xl bg-zinc-800 object-cover"
        />
      )}

      <div className="min-w-0 flex-1">
        <Heading className="text-2xl font-black">{profile.name}</Heading>
        {profile.ruby && (
          <p className="mt-1 text-sm text-zinc-400">{profile.ruby}</p>
        )}

        <dl className="mt-5 grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-zinc-400">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
