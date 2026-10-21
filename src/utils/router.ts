import { useState, useEffect } from 'react';

export type AppRoute =
  | { path: 'dashboard' }
  | { path: 'tests/new' }
  | { path: 'tests/configure'; testId: string }
  | { path: 'tests/attempt'; testId: string; attemptId?: string }
  | { path: 'tests/result'; testId: string; attemptId: string }
  | { path: 'tests/review'; testId: string; attemptId: string }
  | { path: 'leaderboard' }
  | { path: 'analytics' }
  | { path: 'settings' };

export function parseRouteFromLocation(): AppRoute {
  // We support both hash routing (#/tests/new) and path routing (/dashboard)
  const hash = window.location.hash.replace(/^#\/?/, '');
  const pathname = window.location.pathname.replace(/^\//, '');
  const routeString = hash || pathname || 'dashboard';
  const parts = routeString.split('/').filter(Boolean);

  if (parts.length === 0 || parts[0] === 'dashboard') {
    return { path: 'dashboard' };
  }

  if (parts[0] === 'leaderboard') {
    return { path: 'leaderboard' };
  }

  if (parts[0] === 'analytics') {
    return { path: 'analytics' };
  }

  if (parts[0] === 'settings') {
    return { path: 'settings' };
  }

  if (parts[0] === 'tests') {
    if (parts[1] === 'new') {
      return { path: 'tests/new' };
    }
    const testId = parts[1];
    const action = parts[2];

    if (action === 'configure') {
      return { path: 'tests/configure', testId };
    }
    if (action === 'attempt') {
      const attemptId = parts[3];
      return { path: 'tests/attempt', testId, attemptId };
    }
    if (action === 'result') {
      const attemptId = parts[3] || 'latest';
      return { path: 'tests/result', testId, attemptId };
    }
    if (action === 'review') {
      const attemptId = parts[3] || 'latest';
      return { path: 'tests/review', testId, attemptId };
    }
    return { path: 'tests/configure', testId };
  }

  return { path: 'dashboard' };
}

export function navigateTo(route: AppRoute) {
  let target = '';
  switch (route.path) {
    case 'dashboard':
      target = '#/dashboard';
      break;
    case 'tests/new':
      target = '#/tests/new';
      break;
    case 'tests/configure':
      target = `#/tests/${route.testId}/configure`;
      break;
    case 'tests/attempt':
      target = `#/tests/${route.testId}/attempt${route.attemptId ? `/${route.attemptId}` : ''}`;
      break;
    case 'tests/result':
      target = `#/tests/${route.testId}/result/${route.attemptId}`;
      break;
    case 'tests/review':
      target = `#/tests/${route.testId}/review/${route.attemptId}`;
      break;
    case 'leaderboard':
      target = '#/leaderboard';
      break;
    case 'analytics':
      target = '#/analytics';
      break;
    case 'settings':
      target = '#/settings';
      break;
  }

  window.location.hash = target;
  window.dispatchEvent(new CustomEvent('app-route-change', { detail: route }));
}

export function useAppRoute(): [AppRoute, (route: AppRoute) => void] {
  const [route, setRoute] = useState<AppRoute>(() => parseRouteFromLocation());

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseRouteFromLocation());
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('app-route-change', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('app-route-change', handleLocationChange);
    };
  }, []);

  return [route, navigateTo];
}
