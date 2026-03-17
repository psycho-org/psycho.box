import { apiRequest } from '@/lib/client';

export interface WorkspaceMemberDisplaySource {
  membershipId?: string;
  accountId: string;
  name: string;
  role?: string;
  joinedAt?: string | null;
}

interface AuthMeResponse {
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AssigneeLike {
  id: string;
  name?: string;
  email?: string;
}

export interface AssigneeContainer {
  assignee?: AssigneeLike | null;
  assignees?: AssigneeLike[] | null;
}

export type WorkspaceMemberDisplayNameMap = Record<string, string>;

const workspaceMembersCache = new Map<string, WorkspaceMemberDisplaySource[]>();
const workspaceMembersPromiseCache = new Map<string, Promise<WorkspaceMemberDisplaySource[]>>();

export function buildWorkspaceMemberDisplayNameMap(
  members: WorkspaceMemberDisplaySource[],
): WorkspaceMemberDisplayNameMap {
  return members.reduce<WorkspaceMemberDisplayNameMap>((acc, member) => {
    const accountId = member.accountId?.trim();
    const displayName = member.name?.trim();
    if (accountId && displayName) {
      acc[accountId] = displayName;
    }
    return acc;
  }, {});
}

export async function fetchWorkspaceMemberDisplayNameMap(
  workspaceId: string,
): Promise<WorkspaceMemberDisplayNameMap> {
  const members = await fetchWorkspaceMembers(workspaceId);
  return buildWorkspaceMemberDisplayNameMap(members);
}

export async function fetchWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMemberDisplaySource[]> {
  const cached = workspaceMembersCache.get(workspaceId);
  if (cached) return cached;

  const inFlight = workspaceMembersPromiseCache.get(workspaceId);
  if (inFlight) return inFlight;

  const request = apiRequest<WorkspaceMemberDisplaySource[]>(
    `/api/real/workspaces/${workspaceId}/members`,
  )
    .then(async (result) => {
      const members = result.ok && Array.isArray(result.data) ? result.data : [];
      const meResult = await apiRequest<AuthMeResponse>('/api/real/auth/me');
      const currentUser = meResult.ok ? meResult.data?.user : undefined;
      const accountId = currentUser?.id?.trim();
      if (!accountId || members.some((member) => member.accountId === accountId)) {
        workspaceMembersCache.set(workspaceId, members);
        return members;
      }

      const fullName = [currentUser?.firstName?.trim(), currentUser?.lastName?.trim()].filter(Boolean).join(' ');
      const fallbackMember: WorkspaceMemberDisplaySource = {
        accountId,
        name: fullName || currentUser?.email?.trim() || '나',
      };
      const nextMembers = [fallbackMember, ...members];
      workspaceMembersCache.set(workspaceId, nextMembers);
      return nextMembers;
    })
    .finally(() => {
      workspaceMembersPromiseCache.delete(workspaceId);
    });

  workspaceMembersPromiseCache.set(workspaceId, request);
  return request;
}

export function primeWorkspaceMembers(
  workspaceId: string,
  members: WorkspaceMemberDisplaySource[],
) {
  workspaceMembersCache.set(workspaceId, members);
}

export function clearWorkspaceMembersCache(workspaceId?: string) {
  if (workspaceId) {
    workspaceMembersCache.delete(workspaceId);
    workspaceMembersPromiseCache.delete(workspaceId);
    return;
  }

  workspaceMembersCache.clear();
  workspaceMembersPromiseCache.clear();
}

export function applyWorkspaceMemberDisplayNameToAssignee<T extends AssigneeLike>(
  assignee: T | null | undefined,
  displayNameMap: WorkspaceMemberDisplayNameMap,
): T | null | undefined {
  if (!assignee) return assignee;

  const displayName = displayNameMap[assignee.id];
  if (!displayName) return assignee;

  return { ...assignee, name: displayName };
}

export function applyWorkspaceMemberDisplayNamesToTask<T extends AssigneeContainer>(
  task: T,
  displayNameMap: WorkspaceMemberDisplayNameMap,
): T {
  const nextAssignee = applyWorkspaceMemberDisplayNameToAssignee(task.assignee, displayNameMap);
  const nextAssignees = task.assignees?.map((assignee) =>
    applyWorkspaceMemberDisplayNameToAssignee(assignee, displayNameMap) ?? assignee,
  );

  return {
    ...task,
    assignee: nextAssignee,
    assignees: nextAssignees,
  };
}

export function applyWorkspaceMemberDisplayNamesToTasks<T extends AssigneeContainer>(
  tasks: T[],
  displayNameMap: WorkspaceMemberDisplayNameMap,
): T[] {
  return tasks.map((task) => applyWorkspaceMemberDisplayNamesToTask(task, displayNameMap));
}
