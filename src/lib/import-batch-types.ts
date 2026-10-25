export type ImportMode = "posts" | "comments";
export type ImportBatchStatus = "draft" | "running" | "paused" | "completed" | "partial";
export type ImportItemState = "pending" | "published" | "duplicate" | "failed";

export type GhostBatchIdentity = {
  username: string;
  displayName: string;
  activityWeight: number;
  rolePreference: "poster" | "commenter" | "balanced";
};

export type ImportBatchItem = {
  key: string;
  kind: "post" | "comment";
  id: string;
  postKey: string | null;
  parentKey: string | null;
  targetPostId: string | null;
  username: string;
  displayName: string;
  content: string;
  sport: string | null;
  createdAt: string;
  likesCount: number;
  state: ImportItemState;
  error: string | null;
  publishedId: string | null;
  warnings: string[];
};

export type ImportBatch = {
  id: string;
  inputHash: string;
  label: string;
  mode: ImportMode;
  status: ImportBatchStatus;
  plan: ImportBatchItem[];
  warnings: string[];
  createdAt: string;
  updatedAt: string;
};

export type ImportBatchSummary = Pick<ImportBatch, "id" | "label" | "mode" | "status" | "createdAt" | "updatedAt"> & {
  total: number;
  published: number;
  duplicates: number;
  failed: number;
  pending: number;
};

export type ImportBatchStats = {
  manualLikes: number;
  relationshipLikes: number;
  memberRelationshipLikes: number;
  managedRelationshipLikes: number;
  managedPosts: number;
  managedComments: number;
  memberReplies: number;
  deletedItems: number;
};

export type ImportBatchItemPatch = {
  content?: string;
  username?: string;
  createdAt?: string;
  likesCount?: number;
  sport?: string | null;
};

export type BatchActionResult = {
  success: boolean;
  errors: string[];
  batch?: ImportBatch;
  batches?: ImportBatchSummary[];
  reused?: boolean;
  identities?: Pick<GhostBatchIdentity, "username" | "displayName">[];
  stats?: ImportBatchStats;
};
