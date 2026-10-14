"use client";

import { useState } from "react";
import Link from "next/link";
import categoryData from "@/data/vistelq-goods-categories.json";

export default function GoodsCategoryTree({ onSelectCategory }) {
  const [opened, setOpened] = useState({});

  const toggle = (key) => {
    setOpened((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderCategories = (items, parentKey = "") => {
    return items.map((item, index) => {
      const key = `${parentKey}-${index}`;
      const children = item.children || [];
      const hasChildren = children.length > 0;
      const isOpen = Boolean(opened[key]);

      return (
        <div key={key} className="border-b border-white/10 last:border-0">
          <div className="flex items-center gap-2 py-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-expanded={isOpen}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-purple-500/40 text-purple-300 hover:bg-purple-900"
              >
                {isOpen ? "−" : "+"}
              </button>
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center text-zinc-500">
                ›
              </span>
            )}

            <Link
              href={`/goods/category/${item.url?.match(/id=(\\d+)/)?.[1] || ""}`}
              className="text-left text-sm text-zinc-200 transition hover:text-purple-300"
            >
              {item.name}
            </Link>
          </div>

          {hasChildren && isOpen && (
            <div className="ml-5 border-l border-purple-500/30 pl-3">
              {renderCategories(children, key)}
            </div>
          )}
        </div>
      );
    });
  };

  const categories = Array.isArray(categoryData)
    ? categoryData
    : categoryData.categories || [];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white">
          グッズ詳細カテゴリ
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          カテゴリを開いて、お好みのアイテムを探せます。
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        {categories.map((category, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-purple-500/20 bg-zinc-900"
          >
            <div className="bg-gradient-to-r from-purple-950 to-zinc-900 px-5 py-4">
              <Link
                href={`/goods/category/${category.url?.match(/id=(\\d+)/)?.[1] || ""}`}
                className="text-left text-lg font-bold text-white hover:text-purple-300"
              >
                {category.name}
              </Link>
            </div>

            <div className="px-5 py-3">
              {renderCategories(category.children || [], String(index))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
