"use client";

import { cn } from "@/lib/utils";
import styles from "./BattleTestView.module.css";

const lanes = [
  { id: "left", className: styles.leftLane },
  { id: "middle", className: styles.middleLane },
  { id: "right", className: styles.rightLane },
];

const bridges = [
  { id: "left", className: styles.leftBridge },
  { id: "middle", className: styles.middleBridge },
  { id: "right", className: styles.rightBridge },
];

const allyMinions = [
  { id: "ally-left-a", className: styles.allyLeftMinionA },
  { id: "ally-left-b", className: styles.allyLeftMinionB },
  { id: "ally-middle-a", className: styles.allyMiddleMinionA },
  { id: "ally-middle-b", className: styles.allyMiddleMinionB },
  { id: "ally-right-a", className: styles.allyRightMinionA },
  { id: "ally-right-b", className: styles.allyRightMinionB },
];

const opponentMinions = [
  { id: "opponent-left-a", className: styles.opponentLeftMinionA },
  { id: "opponent-left-b", className: styles.opponentLeftMinionB },
  { id: "opponent-middle-a", className: styles.opponentMiddleMinionA },
  { id: "opponent-middle-b", className: styles.opponentMiddleMinionB },
  { id: "opponent-right-a", className: styles.opponentRightMinionA },
  { id: "opponent-right-b", className: styles.opponentRightMinionB },
];

export function BattleArena() {
  return (
    <div aria-hidden="true" className={styles.arena}>
      <div className={cn(styles.zone, styles.opponentZone)} />
      <div className={cn(styles.zone, styles.allyZone)} />
      <div className={styles.river}>
        <span className={styles.riverFoamLeft} />
        <span className={styles.riverFoamRight} />
      </div>

      {lanes.map((lane) => (
        <span className={cn(styles.lane, lane.className)} key={lane.id} />
      ))}

      {bridges.map((bridge) => (
        <span className={cn(styles.bridge, bridge.className)} key={bridge.id}>
          <span />
        </span>
      ))}

      <Tower side="opponent" />
      <Tower side="ally" />

      {opponentMinions.map((minion) => (
        <span
          className={cn(styles.minion, styles.opponentMinion, minion.className)}
          key={minion.id}
        />
      ))}
      {allyMinions.map((minion) => (
        <span
          className={cn(styles.minion, styles.allyMinion, minion.className)}
          key={minion.id}
        />
      ))}
    </div>
  );
}

type TowerProps = {
  side: "ally" | "opponent";
};

function Tower({ side }: TowerProps) {
  const isAlly = side === "ally";

  return (
    <div
      className={cn(
        styles.tower,
        isAlly ? styles.allyTower : styles.opponentTower
      )}
    >
      <span className={styles.towerBase} />
      <span className={styles.towerBody} />
      <span className={styles.towerTop} />
      <span
        className={cn(
          styles.towerFlag,
          isAlly ? styles.allyFlag : styles.opponentFlag
        )}
      />
    </div>
  );
}
