/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as collaborators from "../collaborators.js";
import type * as contacts from "../contacts.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as projects from "../projects.js";
import type * as router from "../router.js";
import type * as seedVenuesData from "../seedVenuesData.js";
import type * as simpleAuth from "../simpleAuth.js";
import type * as venues from "../venues.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  collaborators: typeof collaborators;
  contacts: typeof contacts;
  dashboard: typeof dashboard;
  http: typeof http;
  migrations: typeof migrations;
  projects: typeof projects;
  router: typeof router;
  seedVenuesData: typeof seedVenuesData;
  simpleAuth: typeof simpleAuth;
  venues: typeof venues;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
