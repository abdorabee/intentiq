"use client";

import { createContext, useContext } from "react";

interface ListsTopbarContextValue {
  openCreateModal?: () => void;
  listName?: string;
}

export const ListsTopbarContext = createContext<ListsTopbarContextValue>({});

export function useListsTopbar() {
  return useContext(ListsTopbarContext);
}
