import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { TrashIcon } from '@heroicons/react/24/solid';
import TierTableEditor from './TierTableEditor';

// Minimal types for now
interface RevenueStream {
  id: string;
  name: string;
  tier_table_id?: string | null;
}
interface TierTable {
  id: string;
  name: string;
}
interface Tier {
  id: string;
  name: string;
  min_users: number;
  max_users: number;
  tier_table_id: string;
}

interface ProductAndPricingStepProps {
  assumptions: any;
  onUpdate: (updates: any) => void;
}

export default function ProductAndPricingStep({ assumptions, onUpdate }: ProductAndPricingStepProps) {
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const [tierTables, setTierTables] = useState<TierTable[]>([]);
  const [tiersByTable, setTiersByTable] = useState<Record<string, Tier[]>>({});
  const [loading, setLoading] = useState(true);
  const [creatingTierTableFor, setCreatingTierTableFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch revenue streams and tier tables on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Not authenticated. Please sign in.');
          setLoading(false);
          return;
        }
        const { data: streams, error: streamsError } = await supabase
          .from('revenue_streams')
          .select('*')
          .eq('user_id', user.id);
        if (streamsError) throw streamsError;
        const { data: tables, error: tablesError } = await supabase
          .from('tier_tables')
          .select('*')
          .eq('user_id', user.id);
        if (tablesError) throw tablesError;
        setRevenueStreams((streams as RevenueStream[]) || []);
        setTierTables((tables as TierTable[]) || []);
        // Fetch all tiers for all tables
        if (tables && tables.length > 0) {
          const { data: allTiers, error: tiersError } = await supabase
            .from('tiers')
            .select('*')
            .in('tier_table_id', tables.map(t => t.id));
          if (tiersError) throw tiersError;
          const grouped: Record<string, Tier[]> = {};
          (allTiers || []).forEach((tier: Tier) => {
            if (!grouped[tier.tier_table_id]) grouped[tier.tier_table_id] = [];
            grouped[tier.tier_table_id].push(tier);
          });
          setTiersByTable(grouped);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Add, edit, delete revenue streams (stubbed for now)
  const addRevenueStream = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('revenue_streams').insert({
      user_id: user.id,
      name: '',
      tier_table_id: null,
    }).select().single();
    if (!error && data) setRevenueStreams([...revenueStreams, data]);
  };
  const updateRevenueStream = async (id: string, updates: Partial<RevenueStream>) => {
    setRevenueStreams(revenueStreams.map(s => s.id === id ? { ...s, ...updates } : s));
    await supabase.from('revenue_streams').update(updates).eq('id', id);
  };
  const deleteRevenueStream = async (id: string) => {
    await supabase.from('revenue_streams').delete().eq('id', id);
    setRevenueStreams(revenueStreams.filter(s => s.id !== id));
  };

  // Add, edit, delete tier tables (stubbed for now)
  // ...

  const handleTieredPricingChange = (stream: RevenueStream, checked: boolean) => {
    if (checked) {
      setCreatingTierTableFor(stream.id);
    } else {
      updateRevenueStream(stream.id, { tier_table_id: null });
    }
  };

  const handleSelectTierTable = (stream: RevenueStream, tierTableId: string) => {
    if (tierTableId === 'new') {
      setCreatingTierTableFor(stream.id);
    } else {
      updateRevenueStream(stream.id, { tier_table_id: tierTableId });
    }
  };

  const handleCreateTierTable = async (stream: RevenueStream) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: table, error } = await supabase.from('tier_tables').insert({
      user_id: user.id,
      name: stream.name || 'New Tier Table',
    }).select().single();
    if (!error && table) {
      setTierTables([...tierTables, table]);
      updateRevenueStream(stream.id, { tier_table_id: table.id });
      // Create default tiers
      const defaultTiers: Tier[] = [
        { id: crypto.randomUUID(), name: '', min_users: 0, max_users: 100, tier_table_id: table.id },
        { id: crypto.randomUUID(), name: '', min_users: 101, max_users: 1000, tier_table_id: table.id },
      ];
      await Promise.all(defaultTiers.map(tier =>
        supabase.from('tiers').insert({
          id: tier.id,
          tier_table_id: table.id,
          name: tier.name,
          min_users: tier.min_users,
          max_users: tier.max_users,
        })
      ));
      setTiersByTable({ ...tiersByTable, [table.id]: defaultTiers });
      setCreatingTierTableFor(null);
    }
  };

  const handleTierChange = async (tierTableId: string, tierId: string, field: keyof Tier, value: string | number) => {
    const updatedTiers = (tiersByTable[tierTableId] || []).map(t =>
      t.id === tierId ? { ...t, [field]: value } : t
    );
    setTiersByTable({ ...tiersByTable, [tierTableId]: updatedTiers });
    await supabase.from('tiers').update({ [field]: value }).eq('id', tierId);
  };

  const handleAddTier = async (tierTableId: string) => {
    const newTier: Tier = {
      id: crypto.randomUUID(),
      name: '',
      min_users: 0,
      max_users: 0,
      tier_table_id: tierTableId,
    };
    await supabase.from('tiers').insert({
      id: newTier.id,
      tier_table_id: tierTableId,
      name: newTier.name,
      min_users: newTier.min_users,
      max_users: newTier.max_users,
    });
    setTiersByTable({
      ...tiersByTable,
      [tierTableId]: [...(tiersByTable[tierTableId] || []), newTier],
    });
  };

  const handleDeleteTier = async (tierTableId: string, tierId: string) => {
    await supabase.from('tiers').delete().eq('id', tierId);
    setTiersByTable({
      ...tiersByTable,
      [tierTableId]: (tiersByTable[tierTableId] || []).filter(t => t.id !== tierId),
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Product and Pricing</h2>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>
      )}
      <div className="mb-4">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm border-2 border-pink-500"
          onClick={addRevenueStream}
          disabled={loading}
          type="button"
        >
          {loading ? 'Adding...' : '+ Add revenue stream'}
        </button>
      </div>
      <div className="space-y-6">
        {revenueStreams.map((stream) => {
          const tierTable = tierTables.find(t => t.id === stream.tier_table_id);
          const tiers = tierTable ? tiersByTable[tierTable.id] || [] : [];
          return (
            <div key={stream.id} className="border rounded p-4 bg-white shadow-sm">
              <div className="flex items-center gap-4 mb-2">
                <input
                  className="w-1/3 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  value={stream.name || ''}
                  onChange={e => updateRevenueStream(stream.id, { name: e.target.value })}
                  placeholder="Revenue stream name"
                />
                <button
                  className="ml-auto text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100 transition-colors"
                  aria-label="Delete stream"
                  onClick={() => deleteRevenueStream(stream.id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!stream.tier_table_id || creatingTierTableFor === stream.id}
                    onChange={e => handleTieredPricingChange(stream, e.target.checked)}
                  />
                  Tiered pricing
                </label>
                {(!!stream.tier_table_id && !creatingTierTableFor) && (
                  <select
                    className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    value={stream.tier_table_id}
                    onChange={e => handleSelectTierTable(stream, e.target.value)}
                  >
                    {tierTables.map(table => (
                      <option key={table.id} value={table.id}>{table.name}</option>
                    ))}
                    <option value="new">Create new tier</option>
                  </select>
                )}
                {creatingTierTableFor === stream.id && (
                  <button
                    className="ml-2 text-sm text-primary hover:underline"
                    onClick={() => handleCreateTierTable(stream)}
                  >
                    Create tier table
                  </button>
                )}
              </div>
              {tierTable && (
                <TierTableEditor
                  tierTable={tierTable}
                  tiers={tiers}
                  onChange={() => {}}
                  onAddTier={() => handleAddTier(tierTable.id)}
                  onDeleteTier={tierId => handleDeleteTier(tierTable.id, tierId)}
                  onTierChange={(tierId, field, value) => handleTierChange(tierTable.id, tierId, field, value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 