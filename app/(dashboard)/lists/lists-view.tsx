"use client";

import { useState, useCallback, useEffect } from "react";
import type { ListCardSummary, ListsHeroStats } from "@/lib/lists-types";
import { ListsTopbarContext } from "@/components/dashboard/lists-topbar-context";
import { ListOverview } from "@/components/lists/list-overview";
import { CreateListModal } from "@/components/lists/create-list-modal";

interface ListsViewProps {
  summaries: ListCardSummary[];
  hero: ListsHeroStats;
}

export function ListsView({ summaries, hero }: ListsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const openCreateModal = useCallback(() => setModalOpen(true), []);

  useEffect(() => {
    const handler = () => setModalOpen(true);
    window.addEventListener("lists-open-modal", handler);
    return () => window.removeEventListener("lists-open-modal", handler);
  }, []);

  return (
    <ListsTopbarContext.Provider value={{ openCreateModal }}>
      <div className="lists-page">
        <ListOverview summaries={summaries} hero={hero} />
        <CreateListModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </ListsTopbarContext.Provider>
  );
}
