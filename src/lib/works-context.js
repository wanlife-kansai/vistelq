"use client";

import { createContext, useContext } from "react";

// サーバーで取得した作品一覧を、画面側(クライアント)へ配るための入れ物。
const WorksContext = createContext([]);

export function WorksProvider({ works, children }) {
  return (
    <WorksContext.Provider value={works}>{children}</WorksContext.Provider>
  );
}

export function useWorks() {
  return useContext(WorksContext);
}
