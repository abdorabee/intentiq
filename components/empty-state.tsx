import Link from "next/link";

import {
  emptyStateHasAction,
  getEmptyStateCopy,
  type EmptyStateKind,
  type EmptyStateSurface,
} from "@/lib/empty-state";

export function EmptyState({
  surface,
  kind = "zero",
  onAction,
}: {
  surface: EmptyStateSurface;
  kind?: EmptyStateKind;
  onAction?: () => void;
}) {
  const copy = getEmptyStateCopy(surface, kind);
  const showAction = emptyStateHasAction(copy) && Boolean(onAction || copy.actionHref);

  return (
    <div className="empty-state">
      <div className="empty-state-title">{copy.title}</div>
      <p className="empty-state-copy">{copy.description}</p>
      {showAction && copy.actionLabel && onAction ? (
        <button type="button" className="btn-primary" onClick={onAction}>
          {copy.actionLabel}
        </button>
      ) : showAction && copy.actionLabel && copy.actionHref ? (
        <Link href={copy.actionHref} className="btn-primary">
          {copy.actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
