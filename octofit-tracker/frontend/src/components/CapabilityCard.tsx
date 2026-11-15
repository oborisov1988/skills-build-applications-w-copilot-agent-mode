import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ApiRecord = Record<string, unknown>;
type Props = { title: string; description: string; endpoint: string; collection: string; emptyMessage: string };

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatLabel(field: string): string {
  const label = field.replace(/([A-Z])/g, ' $1');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function CapabilityCard({ title, description, endpoint, collection, emptyMessage }: Props) {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getJson<Record<string, unknown>>(endpoint)
      .then((payload) => {
        const result = payload[collection];
        if (!Array.isArray(result)) throw new Error(`Invalid ${collection} response`);
        if (active) setRecords(result as ApiRecord[]);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [collection, endpoint]);

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>
    {loading ? <p role="status">Loading {title.toLowerCase()}...</p>
      : error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        : records.length === 0 ? <p role="status">{emptyMessage}</p>
          : <ul className="list-group list-group-flush">{records.map((record, index) => <li className="list-group-item" key={String(record._id ?? index)}>
            {Object.entries(record).filter(([field, value]) => field !== '_id' && field !== '__v' && value != null).map(([field, value]) => <span className="me-3" key={field}><strong>{formatLabel(field)}:</strong> {formatValue(value)}</span>)}
          </li>)}</ul>}
  </div></section>;
}
