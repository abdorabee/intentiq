"use client";

import { createAvatar } from "@bible-strong/avatar-react";
import "@bible-strong/avatar-react/styles.css";

import strobiJson from "./strobi.avatar.json";
import type { AuthAvatarTarget } from "./resolve-auth-avatar-target";

const StrobiAvatar = createAvatar(strobiJson);

export function AuthAvatar({ target }: { target: AuthAvatarTarget }) {
  const shared = {
    size: 200,
    className: "auth-avatar",
    ariaLabel: "Strobi, a character who reacts as you type",
  } as const;

  return (
    <div className="auth-avatar-wrap" aria-hidden="false">
      {target.kind === "animation" ? (
        <StrobiAvatar {...shared} animation={target.animation} />
      ) : (
        <StrobiAvatar {...shared} expression={target.expression} />
      )}
    </div>
  );
}
