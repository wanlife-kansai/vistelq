"use client";

import { createContext, useContext } from "react";

// サーバーで取得した作品一覧を、画面側(クライアント)へ配るための入れ物。
const WorksContext = createContext([]);

const TotalContext = createContext(null);

export function WorksProvider({ works, total = null, children }) {
  return (
    <WorksContext.Provider value={works}>
      <TotalContext.Provider value={total}>{children}</TotalContext.Provider>
    </WorksContext.Provider>
  );
}

// サイト全体の作品数（取得できなければ読み込み済みの件数）
export function useWorksTotal() {
  const total = useContext(TotalContext);
  const works = useContext(WorksContext);
  return typeof total === "number" && total >= works.length ? total : works.length;
}

export function useWorks() {
  return useContext(WorksContext);
}
