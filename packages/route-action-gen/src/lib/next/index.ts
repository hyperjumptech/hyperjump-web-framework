/**
 * Next.js-specific exports for route-action-gen
 */

export { createRoute } from "./app/route.js";
export {
  createFormAction,
  createServerFunction,
} from "./app/server-actions.js";
export {
  processRequest,
  processFormAction,
  processServerFunction,
} from "./process.js";
export { createPagesRoute } from "./pages/index.js";
