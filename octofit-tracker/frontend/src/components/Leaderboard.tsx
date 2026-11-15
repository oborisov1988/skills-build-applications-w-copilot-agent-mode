import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

function loadLeaderboard() {
  return getJson<Record<string, unknown>>('/api/leaderboard');
}

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." endpoint="/api/leaderboard" collection="leaderboard" emptyMessage="No leaderboard rankings yet." loadData={loadLeaderboard} />;
}
