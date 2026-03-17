'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/client';
import {
  applyWorkspaceMemberDisplayNamesToTasks,
  fetchWorkspaceMemberDisplayNameMap,
} from '@/lib/workspace-member-display';
import { TaskStatusDot } from '@/components/ui';
import type { TaskStatus } from '@/lib/task-status';

interface Sprint {
  sprintId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
}

interface Project {
  projectId: string;
  name: string;
  progress: {
    totalCount: number;
    completedCount: number;
    progress: number;
  };
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee?: { id: string; name: string; email: string } | null;
  dueDate?: string | null;
}

function ChevronIcon({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <svg
      className={`${className} transition-transform ${expanded ? 'rotate-90' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function SprintsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Map of projectId -> Tasks
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({});
  const [tasksLoadingByProject, setTasksLoadingByProject] = useState<Record<string, boolean>>({});
  const tasksByProjectRef = useRef<Record<string, Task[]>>({});
  const tasksLoadingByProjectRef = useRef<Record<string, boolean>>({});

  // Which projects are expanded to show tasks
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    tasksByProjectRef.current = tasksByProject;
  }, [tasksByProject]);

  useEffect(() => {
    tasksLoadingByProjectRef.current = tasksLoadingByProject;
  }, [tasksLoadingByProject]);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    // Note: The UI currently proxies `/api/real/...` to the backend.
    apiRequest<{ data: Sprint[] }>(`/api/real/workspaces/${workspaceId}/sprints?page=0&size=100`)
      .then((result) => {
        if (result.ok) {
          // Spring pagination usually wraps list in content or just data, based on PageInfoSupport.
          // Let's handle both typical formats.
          const list = Array.isArray(result.data) ? result.data : (result.data as any)?.content || [];
          setSprints(list);
        } else {
          setError(result.message ?? '스프린트 목록을 불러오지 못했습니다.');
        }
      })
      .catch(() => setError('네트워크 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const fetchTasksForProject = useCallback((projectId: string) => {
    if (tasksByProjectRef.current[projectId] || tasksLoadingByProjectRef.current[projectId]) return;

    setTasksLoadingByProject(prev => ({ ...prev, [projectId]: true }));
    Promise.all([
      apiRequest<{ data: Task[] }>(`/api/real/workspaces/${workspaceId}/projects/${projectId}/tasks?page=0&size=100`),
      fetchWorkspaceMemberDisplayNameMap(workspaceId),
    ])
      .then(([result, memberDisplayNameMap]) => {
        if (result.ok) {
          const list = Array.isArray(result.data) ? result.data : (result.data as any)?.content || [];
          setTasksByProject(prev => ({
            ...prev,
            [projectId]: applyWorkspaceMemberDisplayNamesToTasks(list, memberDisplayNameMap),
          }));
        }
      })
      .finally(() => setTasksLoadingByProject(prev => ({ ...prev, [projectId]: false })));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !selectedSprintId) {
      setProjects([]);
      setTasksByProject({});
      setExpandedProjects({});
      return;
    }

    setProjectsLoading(true);
    apiRequest<{ data: Project[] }>(`/api/real/workspaces/${workspaceId}/sprints/${selectedSprintId}/projects`)
      .then((result) => {
        if (result.ok) {
          const list = Array.isArray(result.data) ? result.data : [];
          setProjects(list);

          if (list.length > 0) {
            const firstProjectId = list[0].projectId;
            setExpandedProjects({ [firstProjectId]: true });
            fetchTasksForProject(firstProjectId);
          }
        } else {
          setError(result.message ?? '프로젝트 목록을 불러오지 못했습니다.');
        }
      })
      .catch(() => setError('프로젝트를 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setProjectsLoading(false));
  }, [workspaceId, selectedSprintId, fetchTasksForProject]);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const isExpanded = !prev[projectId];
      if (isExpanded) {
        fetchTasksForProject(projectId);
      }
      return { ...prev, [projectId]: isExpanded };
    });
  };

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Sidebar for Sprints */}
      <aside className="w-64 shrink-0 flex flex-col bg-surface border border-line/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line/60">
          <h2 className="text-sm font-semibold text-text m-0">스프린트</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {loading ? (
             <p className="text-text-soft text-[13px] px-2 py-2">로딩 중...</p>
          ) : error ? (
             <p className="text-red text-[13px] px-2 py-2">{error}</p>
          ) : sprints.length === 0 ? (
             <p className="text-text-soft text-[13px] px-2 py-2">스프린트가 없습니다.</p>
          ) : (
            sprints.map((sprint) => (
              <button
                key={sprint.sprintId}
                onClick={() => setSelectedSprintId(sprint.sprintId)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-colors ${
                  selectedSprintId === sprint.sprintId
                    ? 'bg-accent-dim/80 text-accent-soft border border-accent/20'
                    : 'text-text hover:bg-surface-2 border border-transparent'
                }`}
              >
                <div className="font-medium text-[14px] truncate">{sprint.name}</div>
                <div className="text-[12px] opacity-70 mt-1 flex justify-between">
                   <span>{sprint.startDate && sprint.startDate.slice(0, 10)}</span>
                   <span>~ {sprint.endDate && sprint.endDate.slice(0, 10)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Content: Projects and Tasks */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface border border-line/40 rounded-2xl overflow-hidden shadow-sm p-5 relative">
        {!selectedSprintId ? (
          <div className="flex-1 flex items-center justify-center text-text-dim text-[14px]">
            왼쪽에서 스프린트를 선택해주세요.
          </div>
        ) : projectsLoading ? (
            <div className="flex-1 flex items-center justify-center text-text-soft text-[14px]">
              프로젝트를 불러오는 중...
            </div>
        ) : projects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-text-soft text-[14px]">
              이 스프린트에 등록된 프로젝트가 없습니다.
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-4">
              {projects.map(project => {
                const isExpanded = expandedProjects[project.projectId];
                const tasks = tasksByProject[project.projectId] || [];
                const isLoadingTasks = tasksLoadingByProject[project.projectId];

                return (
                  <div key={project.projectId} className="border border-line/60 rounded-xl overflow-hidden bg-surface">
                    <button
                      onClick={() => toggleProjectExpand(project.projectId)}
                      className="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-2/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronIcon className="size-4 text-text-dim shrink-0" expanded={!!isExpanded} />
                        <h3 className="text-[15px] font-semibold text-text truncate m-0">{project.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                         <div className="flex items-center gap-2">
                            <span className="text-[12px] text-text-dim tabular-nums">
                              {project.progress.completedCount} / {project.progress.totalCount}
                            </span>
                            <div className="w-16 h-2 bg-surface-3 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-accent transition-all duration-300"
                                 style={{
                                   width: `${project.progress.totalCount > 0 ? (project.progress.completedCount / project.progress.totalCount) * 100 : 0}%`,
                                 }}
                               />
                            </div>
                         </div>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-line/60 p-4 bg-surface-2/30">
                        {isLoadingTasks ? (
                           <div className="py-2 text-[13px] text-text-soft">태스크 불러오는 중...</div>
                        ) : tasks.length === 0 ? (
                           <div className="py-2 text-[13px] text-text-dim">등록된 태스크가 없습니다.</div>
                        ) : (
                           <div className="space-y-2">
                             {tasks.map(task => (
                               <div key={task.id} className="flex items-center justify-between p-3 bg-surface border border-line/40 rounded-lg hover:border-line/80 transition-colors">
                                  <div className="flex items-center gap-3 min-w-0">
                                     <TaskStatusDot status={task.status} className="size-2.5 shrink-0" />
                                     <span className="text-[14px] text-text font-medium truncate">{task.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                     {task.dueDate && (
                                       <span className="text-[12px] text-text-dim tabular-nums">
                                         {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                                       </span>
                                     )}
                                     <div className="w-24 text-right truncate text-[13px] text-text-soft">
                                       {task.assignee?.name || task.assignee?.email || '담당자 없음'}
                                     </div>
                                  </div>
                               </div>
                             ))}
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        )}
      </main>
    </div>
  );
}
