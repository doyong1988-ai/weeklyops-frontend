import { Navigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export const DEFAULT_ROUTE_BY_ROLE = {
  member: '/dashboard',
  leader: '/team',
};

// Wrap a <Route element={...}> with this to restrict it to certain roles.
// Usage: <Route path="/team" element={<RoleRoute roles={['leader']}><LeaderDashboardPage/></RoleRoute>} />
export default function RoleRoute({ roles, children }) {
  const role = useAppStore((s) => s.role);

  if (!roles.includes(role)) {
    return <Navigate to={DEFAULT_ROUTE_BY_ROLE[role]} replace />;
  }
  return children;
}
