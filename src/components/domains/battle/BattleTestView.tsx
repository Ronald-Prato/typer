"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Castle, Shield, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { BattleArena } from "./BattleArena";
import styles from "./BattleTestView.module.css";

export function BattleTestView() {
  return (
    <main className="relative h-screen overflow-hidden bg-[#0f1720] text-white">
      <div className={styles.skyGlow} />
      <div className={styles.vignette} />

      <header className="pointer-events-none fixed left-0 right-0 top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 sm:px-8">
        <Link
          aria-label="Volver a inicio"
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white/82 shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition hover:border-orange-300/45 hover:text-orange-200"
          href="/home"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-3 rounded-full border border-white/12 bg-[#111923]/76 px-4 py-2 shadow-[0_16px_42px_rgba(0,0,0,0.32)]">
          <Swords className="size-4 text-orange-300" aria-hidden="true" />
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
            Batalla
          </p>
        </div>

        <div className="justify-self-end rounded-full border border-white/12 bg-[#111923]/76 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/64 shadow-[0_16px_42px_rgba(0,0,0,0.24)]">
          MVP
        </div>
      </header>

      <section
        aria-label="Campo frontal de batalla 1 contra 1"
        className="relative z-10 flex h-full items-center justify-center px-4 pt-14 sm:px-8 sm:pt-16"
      >
        <div className={styles.arenaFrame}>
          <BattleArena />
        </div>
      </section>

      <BattleHud />
    </main>
  );
}

function BattleHud() {
  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-5 z-30 mx-auto grid w-[min(92vw,52rem)] grid-cols-2 gap-3 px-1 sm:bottom-7 sm:gap-4">
      <StatusPanel
        accent="bg-emerald-400"
        icon={<Shield className="size-4" aria-hidden="true" />}
        label="Tu torre"
        value="100%"
      />
      <StatusPanel
        accent="bg-orange-400"
        icon={<Castle className="size-4" aria-hidden="true" />}
        label="Torre rival"
        value="100%"
      />
    </aside>
  );
}

type StatusPanelProps = {
  accent: string;
  icon: ReactNode;
  label: string;
  value: string;
};

function StatusPanel({ accent, icon, label, value }: StatusPanelProps) {
  return (
    <div className="min-w-0 rounded-md border border-white/12 bg-[#101821]/78 p-3 shadow-[0_18px_42px_rgba(0,0,0,0.28)] sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-white/78">
          {icon}
          <p className="truncate text-xs font-black uppercase tracking-[0.14em]">
            {label}
          </p>
        </div>
        <span className="text-sm font-black text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", accent)} />
      </div>
    </div>
  );
}
