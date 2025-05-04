// Legacy file - Queries have been moved to dedicated modules
// This file re-exports from those modules for backward compatibility

// Re-export lifelogs queries
export { get as getLifelogWithApproval } from "./lifelogs/get";
export { withTags as getLifelogWithTags } from "./lifelogs/get";
export { complete as getLifelogComplete } from "./lifelogs/get";
export { latest as getLatestLifelog } from "./lifelogs/get";
export { list as listLifelogs } from "./lifelogs/list";
export { approved as getPaginatedApprovedLifelogs } from "./lifelogs/list";

// Re-export tags queries
export { list as listTags } from "./tags/list";
export { visibilityScopes as listVisibilityScopes } from "./tags/list";

// Re-export approvals queries
export { list as getPendingApprovals } from "./approvals/list";

// Re-export constants for backward compatibility
export { TAG_VISIBILITY } from "./lifelogs/access";