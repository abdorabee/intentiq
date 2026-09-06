"use client";

import { useMemo, useState, type ChangeEvent, type FocusEvent } from "react";

import {
  resolveAuthAvatarTarget,
  type AuthAvatarFocus,
  type AuthAvatarInput,
} from "./resolve-auth-avatar-target";

const INITIAL: AuthAvatarInput = {
  focus: null,
  value: "",
  passwordVisible: false,
  hasError: false,
  success: false,
};

export function useAuthAvatar() {
  const [input, setInput] = useState<AuthAvatarInput>(INITIAL);
  const target = useMemo(() => resolveAuthAvatarTarget(input), [input]);

  return {
    target,
    passwordVisible: input.passwordVisible,
    watch: (focus: Exclude<AuthAvatarFocus, null>) => ({
      onFocus: (event: FocusEvent<HTMLInputElement>) => {
        setInput((current) => ({
          ...current,
          focus,
          value: event.target.value,
          hasError: false,
        }));
      },
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        setInput((current) => ({
          ...current,
          focus,
          value: event.target.value,
          hasError: false,
        }));
      },
      onBlur: () => {
        setInput((current) => ({ ...current, focus: null }));
      },
    }),
    setPasswordVisible: (passwordVisible: boolean) => {
      setInput((current) => ({ ...current, passwordVisible }));
    },
    setError: (hasError: boolean) => {
      setInput((current) => ({ ...current, hasError, success: hasError ? false : current.success }));
    },
    setSuccess: (success: boolean) => {
      setInput((current) => ({ ...current, success, hasError: success ? false : current.hasError }));
    },
  };
}
