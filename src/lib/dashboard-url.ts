import type { DashboardView, TaskLayout, TaskStatus } from '@/lib/types';

type DashboardLinkParams = {
  view?: DashboardView;
  layout?: TaskLayout;
  status?: TaskStatus;
  // projectId, ou "none" para tarefas sem projeto
  project?: number | 'none';
};

/**
 * Monta o endereço do painel com a seção e os filtros (?view=&layout=&status=&project=)
 * O resumo é a seção padrão e não aparece na URL
 */
export function dashboardHref({ view, layout, status, project }: DashboardLinkParams = {}): string {
  const query = new URLSearchParams();
  if (view && view !== 'resumo') query.set('view', view);
  if (layout) query.set('layout', layout);
  if (status) query.set('status', status);
  if (project !== undefined) query.set('project', String(project));

  const search = query.toString();
  return search ? `/dashboard?${search}` : '/dashboard';
}
