"use client";

import { useEffect, useRef } from "react";
import {
  pickGlobalShortcut,
  type ShortcutModifier,
  type ShortcutRegistration,
  type ShortcutScope,
} from "@/domain/shortcuts";

type ShortcutHandler = () => void;

interface UseGlobalShortcutOptions {
  scope: ShortcutScope;
  key: string;
  modifier?: ShortcutModifier;
  enabled?: boolean;
  onShortcut: ShortcutHandler;
}

interface RuntimeShortcutRegistration extends ShortcutRegistration {
  onShortcut: ShortcutHandler;
}

const registrations = new Map<number, RuntimeShortcutRegistration>();
let nextRegistrationId = 1;
let listenerCount = 0;

export function useGlobalShortcut({
  scope,
  key,
  modifier = "none",
  enabled = true,
  onShortcut,
}: UseGlobalShortcutOptions): void {
  const idRef = useRef<number | null>(null);
  const handlerRef = useRef(onShortcut);
  handlerRef.current = onShortcut;

  useEffect(() => {
    const id = nextRegistrationId++;
    idRef.current = id;
    registrations.set(id, {
      id,
      scope,
      key,
      modifier,
      enabled,
      onShortcut: () => handlerRef.current(),
    });

    ensureDocumentListener();

    return () => {
      registrations.delete(id);
      releaseDocumentListener();
      idRef.current = null;
    };
  }, [enabled, key, modifier, scope]);
}

function ensureDocumentListener() {
  if (listenerCount === 0) {
    document.addEventListener("keydown", handleDocumentKeyDown);
  }
  listenerCount += 1;
}

function releaseDocumentListener() {
  listenerCount = Math.max(listenerCount - 1, 0);
  if (listenerCount === 0) {
    document.removeEventListener("keydown", handleDocumentKeyDown);
  }
}

function handleDocumentKeyDown(event: KeyboardEvent) {
  const picked = pickGlobalShortcut(Array.from(registrations.values()), event);
  if (!picked) return;

  event.preventDefault();
  event.stopPropagation();
  picked.onShortcut();
}
