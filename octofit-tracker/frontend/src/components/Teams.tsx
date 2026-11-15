import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

function loadTeams() {
  return getJson<Record<string, unknown>>('/api/teams');
}

export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." endpoint="/api/teams" collection="teams" emptyMessage="No teams yet." loadData={loadTeams} />;
}
