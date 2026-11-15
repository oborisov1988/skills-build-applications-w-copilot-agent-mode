import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

function loadActivities() {
  return getJson<Record<string, unknown>>('/api/activities');
}

export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." endpoint="/api/activities" collection="activities" emptyMessage="No activities yet." loadData={loadActivities} />;
}
