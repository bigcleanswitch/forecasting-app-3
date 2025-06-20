import { TrashIcon } from '@heroicons/react/24/solid';

interface Tier {
  id: string;
  name: string;
  min_users: number;
  max_users: number;
}

interface TierTableEditorProps {
  tierTable: { id: string; name: string };
  tiers: Tier[];
  onChange: (tiers: Tier[]) => void;
  onAddTier: () => void;
  onDeleteTier: (id: string) => void;
  onTierChange: (id: string, field: keyof Tier, value: string | number) => void;
}

export default function TierTableEditor({ tierTable, tiers, onChange, onAddTier, onDeleteTier, onTierChange }: TierTableEditorProps) {
  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold mb-2">Tiers for: {tierTable.name}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-sm text-gray-600 font-semibold">
            <th className="w-[160px] text-left">Tier Name</th>
            <th className="w-[100px] text-left">Min</th>
            <th className="w-[100px] text-left">Max</th>
            <th className="w-[60px] text-left">Users</th>
            <th className="w-[40px]"></th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.id} className="border-b hover:bg-gray-50">
              <td>
                <input
                  className="w-full h-9 px-2 py-1 text-sm border border-gray-300 rounded-md"
                  value={tier.name || ''}
                  onChange={e => onTierChange(tier.id, 'name', e.target.value)}
                  placeholder="Tier name (optional)"
                />
              </td>
              <td>
                <input
                  className="w-full h-9 px-2 py-1 text-sm border border-gray-300 rounded-md"
                  type="number"
                  value={tier.min_users}
                  onChange={e => onTierChange(tier.id, 'min_users', parseInt(e.target.value) || 0)}
                  placeholder="Min"
                />
              </td>
              <td>
                <input
                  className="w-full h-9 px-2 py-1 text-sm border border-gray-300 rounded-md"
                  type="number"
                  value={tier.max_users}
                  onChange={e => onTierChange(tier.id, 'max_users', parseInt(e.target.value) || 0)}
                  placeholder="Max"
                />
              </td>
              <td>
                <span className="text-sm text-gray-600">users</span>
              </td>
              <td>
                <button
                  className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100 transition-colors"
                  aria-label="Delete tier"
                  onClick={() => onDeleteTier(tier.id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="text-sm text-primary hover:underline mt-2"
        onClick={onAddTier}
      >
        + Add tier
      </button>
    </div>
  );
} 