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
import type * as CustomProfile from "../CustomProfile.js";
import type * as admin from "../admin.js";
import type * as approvals_list from "../approvals/list.js";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as customAuth from "../customAuth.js";
import type * as dashboard_fetch from "../dashboard/fetch.js";
import type * as dashboard_helpers from "../dashboard/helpers.js";
import type * as destructive from "../destructive.js";
import type * as errors from "../errors.js";
import type * as http from "../http.js";
import type * as lifelogs_access from "../lifelogs/access.js";
import type * as lifelogs_get from "../lifelogs/get.js";
import type * as lifelogs_list from "../lifelogs/list.js";
import type * as mutations from "../mutations.js";
import type * as populateTestData from "../populateTestData.js";
import type * as queries from "../queries.js";
import type * as tags_list from "../tags/list.js";
import type * as types from "../types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  CustomProfile: typeof CustomProfile;
  admin: typeof admin;
  "approvals/list": typeof approvals_list;
  auth: typeof auth;
  conversations: typeof conversations;
  customAuth: typeof customAuth;
  "dashboard/fetch": typeof dashboard_fetch;
  "dashboard/helpers": typeof dashboard_helpers;
  destructive: typeof destructive;
  errors: typeof errors;
  http: typeof http;
  "lifelogs/access": typeof lifelogs_access;
  "lifelogs/get": typeof lifelogs_get;
  "lifelogs/list": typeof lifelogs_list;
  mutations: typeof mutations;
  populateTestData: typeof populateTestData;
  queries: typeof queries;
  "tags/list": typeof tags_list;
  types: typeof types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
