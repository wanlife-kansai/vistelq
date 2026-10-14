"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const languages = [
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "en", label: "🇺🇸 English" },
  { code: "zh", label: "🇨🇳 简体中文" },
  { code: "zh-TW", label: "��🇼 繁體中文" },
  { code: "ko", label: "🇰🇷 한국어" },
];

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("ja");

  useEffect(() => {
    const saved = localStorage.getItem("vistelq-language");
    if (saved) setLanguage(saved);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();

    const keyword = query.trim();
    if (!keyword) return;

    router.push(
      `/videos/search?keyword=${encodeURIComponent(keyword)}`
    );
  };

  return (
    <header className="border-b border-white/10 bg-[#101018]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-5 py-5">
        <Link
          href="/"
          className="text-3xl font-black text-purple-400"
        >
          VISTELQ
        </Link>

        <form
          onSubmit={handleSearch}
          className="flex min-w-0 flex-1 gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="作品名・ASP名で検索"
            className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-5 py-3 text-white outline-none"
          />

          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-500"
          >
            検索
          </button>
        </form>

        <div className="flex items-center gap-2 rounded-lg border border-purple-500 bg-zinc-900 px-3 py-2">
          <span aria-hidden="true">🌐</span>

          <select
            aria-label="表示言語を選択"
            value={language}
            onChange={(event) => {
              const next = event.target.value;
              setLanguage(next);
              localStorage.setItem("vistelq-language", next);
              window.dispatchEvent(new Event("vistelq-language-change"));
            }}
            className="max-w-36 cursor-pointer bg-transparent text-sm text-white outline-none"
          >
            {languages.map((item) => (
              <option
                key={item.code}
                value={item.code}
                className="bg-zinc-900"
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <Link
          href="/favorites"
          className="rounded-lg border border-purple-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-950"
        >
          ♡ お気に入り
        </Link>

        <button
          type="button"
          className="rounded-lg border border-purple-500 px-5 py-3 text-white hover:bg-purple-950"
        >
          ログイン
        </button>
      </div>
    </header>
  );
}
