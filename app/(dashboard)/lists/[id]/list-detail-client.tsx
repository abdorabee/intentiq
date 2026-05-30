"use client";

import { useState, useCallback, useEffect } from "react";
import type { ListDetailData } from "@/lib/lists-types";
import { ListsTopbarContext } from "@/components/dashboard/lists-topbar-context";
import { ListDetailView } from "@/components/lists/list-detail-view";
import { CreateListModal } from "@/components/lists/create-list-modal";

interface ListDetailClientProps {
  detail: ListDetailData;
}

export function ListDetailClient({ detail }: ListDetailClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const openCreateModal = useCallback(() => setModalOpen(true), []);

  useEffect(() => {
    const handler = () => setModalOpen(true);
    window.addEventListener("lists-open-modal", handler);
    return () => window.removeEventListener("lists-open-modal", handler);
  }, []);

  return (
    <ListsTopbarContext.Provider value={{ openCreateModal, listName: detail.list.name }}>
      <div className="lists-page">
        <ListDetailView detail={detail} />
        <CreateListModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </ListsTopbarContext.Provider>
  );
}
