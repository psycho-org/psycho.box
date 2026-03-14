import { redirect } from 'next/navigation';

export default async function WorkspaceRedirectPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  redirect(`/workspaces/${workspaceId}/board`);
}
