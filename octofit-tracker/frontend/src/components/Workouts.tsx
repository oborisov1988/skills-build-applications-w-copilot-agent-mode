import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

function loadWorkouts() {
  return getJson<Record<string, unknown>>('/api/workouts/suggestions/mona%40example.com');
}

export default function Workouts() {
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." endpoint="/api/workouts/suggestions/mona%40example.com" collection="suggestions" emptyMessage="No workout suggestions yet." loadData={loadWorkouts} />;
}
