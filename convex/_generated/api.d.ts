/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as crons from "../crons.js";
import type * as game from "../game.js";
import type * as gameLifecycle from "../gameLifecycle.js";
import type * as gameStateMachine from "../gameStateMachine.js";
import type * as helpers_getCurrentUser from "../helpers/getCurrentUser.js";
import type * as history from "../history.js";
import type * as historyPagination from "../historyPagination.js";
import type * as migrations from "../migrations.js";
import type * as practice from "../practice.js";
import type * as practiceState from "../practiceState.js";
import type * as queue from "../queue.js";
import type * as queueState from "../queueState.js";
import type * as socialData from "../socialData.js";
import type * as socialState from "../socialState.js";
import type * as typingContent from "../typingContent.js";
import type * as typingContentSeed from "../typingContentSeed.js";
import type * as typingContentState from "../typingContentState.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  game: typeof game;
  gameLifecycle: typeof gameLifecycle;
  gameStateMachine: typeof gameStateMachine;
  "helpers/getCurrentUser": typeof helpers_getCurrentUser;
  history: typeof history;
  historyPagination: typeof historyPagination;
  migrations: typeof migrations;
  practice: typeof practice;
  practiceState: typeof practiceState;
  queue: typeof queue;
  queueState: typeof queueState;
  socialData: typeof socialData;
  socialState: typeof socialState;
  typingContent: typeof typingContent;
  typingContentSeed: typeof typingContentSeed;
  typingContentState: typeof typingContentState;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
