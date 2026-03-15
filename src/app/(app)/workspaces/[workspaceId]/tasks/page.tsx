'use client';

import { use } from 'react';
import { redirect } from 'next/navigation';

export default function TasksPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  redirect(`/workspaces/${workspaceId}/board?view=sprint`);
}
