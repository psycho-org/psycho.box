'use client';

import { CardList } from '@/components/ui';
import { TodoCard } from '@/components/todo-card';
import type { TodoCardTask } from '@/components/todo-card';

export interface TodoCardListProps {
  tasks: TodoCardTask[];
  sprintEndDate?: string | null;
  onCardClick?: (task: TodoCardTask, index: number) => void;
  columns?: number;
  emptyMessage?: string;
}

/**
 * TodoCard를 그리드로 보여주는 리스트.
 */
export function TodoCardList({
  tasks,
  sprintEndDate,
  onCardClick,
  columns = 3,
  emptyMessage = '태스크가 없습니다.',
}: TodoCardListProps) {
  return (
    <CardList<TodoCardTask>
      items={tasks}
      renderCard={(task) => <TodoCard task={task} sprintEndDate={sprintEndDate} />}
      onCardClick={onCardClick}
      getItemId={(t) => t.id}
      columns={columns}
      emptyMessage={emptyMessage}
    />
  );
}
