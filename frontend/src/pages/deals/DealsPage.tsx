import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar, Plus, X } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, any> = {
  'Due Diligence': 'primary',
  'Term Sheet': 'secondary',
  'Negotiation': 'accent',
  'Closed': 'success',
  'Passed': 'error',
};

export const DealsPage: React.FC = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [newDeal, setNewDeal] = useState({
    entrepreneurId: '',
    amount: '',
    equity: '',
    stage: 'Seed',
    status: 'Due Diligence',
    notes: '',
  });

  const statuses = Object.keys(STATUS_COLORS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, entRes] = await Promise.all([
          api.get('/deals'),
          user?.role === 'investor' ? api.get('/users/entrepreneurs') : Promise.resolve({ data: { entrepreneurs: [] } }),
        ]);
        setDeals(dealsRes.data.deals || []);
        setStats(dealsRes.data.stats || {});
        setEntrepreneurs(entRes.data.entrepreneurs || []);
      } catch {
        toast.error('Failed to load deals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleAddDeal = async () => {
    try {
      const { data } = await api.post('/deals', newDeal);
      setDeals((prev) => [data.deal, ...prev]);
      setShowAddModal(false);
      setNewDeal({ entrepreneurId: '', amount: '', equity: '', stage: 'Seed', status: 'Due Diligence', notes: '' });
      toast.success('Deal added');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add deal');
    }
  };

  const handleUpdateStatus = async (dealId: string, status: string) => {
    try {
      const { data } = await api.put(`/deals/${dealId}`, { status });
      setDeals((prev) => prev.map((d) => (d._id === dealId ? data.deal : d)));
      toast.success('Deal updated');
    } catch {
      toast.error('Failed to update deal');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    try {
      await api.delete(`/deals/${dealId}`);
      setDeals((prev) => prev.filter((d) => d._id !== dealId));
      toast.success('Deal deleted');
    } catch {
      toast.error('Failed to delete deal');
    }
  };

  const toggleStatus = (status: string) =>
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );

  const filteredDeals = deals.filter((deal) => {
    const entrepreneur = deal.entrepreneurId;
    const matchesSearch =
      !searchQuery ||
      entrepreneur?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur?.startupName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatuses.length || selectedStatuses.includes(deal.status);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">Track and manage your investment pipeline</p>
        </div>
        {user?.role === 'investor' && (
          <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
            Add Deal
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Deals', value: stats.activeDeals, icon: <TrendingUp size={20} className="text-primary-600" />, bg: 'bg-primary-100' },
          { label: 'Total Deals', value: stats.totalDeals, icon: <Users size={20} className="text-secondary-600" />, bg: 'bg-secondary-100' },
          { label: 'Closed Deals', value: stats.closedDeals, icon: <DollarSign size={20} className="text-accent-600" />, bg: 'bg-accent-100' },
          { label: 'This Month', value: deals.filter((d) => new Date(d.createdAt) > new Date(Date.now() - 30 * 86400000)).length, icon: <Calendar size={20} className="text-green-600" />, bg: 'bg-green-100' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <div className="flex items-center">
                <div className={`p-3 ${stat.bg} rounded-lg mr-3`}>{stat.icon}</div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{loading ? '...' : stat.value ?? 0}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search deals by startup name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>
        <div className="w-full md:w-1/3 flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-gray-500" />
          {statuses.map((status) => (
            <Badge
              key={status}
              variant={selectedStatuses.includes(status) ? STATUS_COLORS[status] : 'gray'}
              className="cursor-pointer"
              onClick={() => toggleStatus(status)}
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>

      {/* Deals table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Deals</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading deals...</p>
          ) : filteredDeals.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No deals found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Startup', 'Amount', 'Equity', 'Status', 'Stage', 'Last Activity', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeals.map((deal) => (
                    <tr key={deal._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={deal.entrepreneurId?.avatarUrl}
                            alt={deal.entrepreneurId?.name}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{deal.entrepreneurId?.startupName || deal.entrepreneurId?.name}</p>
                            <p className="text-xs text-gray-500">{deal.entrepreneurId?.industry}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{deal.amount}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{deal.equity}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {user?.role === 'investor' ? (
                          <select
                            value={deal.status}
                            onChange={(e) => handleUpdateStatus(deal._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            {statuses.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <Badge variant={STATUS_COLORS[deal.status]}>{deal.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{deal.stage}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(deal.lastActivity || deal.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        {user?.role === 'investor' && (
                          <button onClick={() => handleDeleteDeal(deal._id)} className="text-red-500 hover:text-red-700 text-xs">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add New Deal</h2>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entrepreneur</label>
                <select
                  value={newDeal.entrepreneurId}
                  onChange={(e) => setNewDeal({ ...newDeal, entrepreneurId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select entrepreneur</option>
                  {entrepreneurs.map((e) => (
                    <option key={e._id} value={e._id}>{e.name} – {e.startupName}</option>
                  ))}
                </select>
              </div>
              {[
                { label: 'Amount (e.g. $1.5M)', key: 'amount', placeholder: '$1.5M' },
                { label: 'Equity (e.g. 15%)', key: 'equity', placeholder: '15%' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={(newDeal as any)[field.key]}
                    onChange={(e) => setNewDeal({ ...newDeal, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={newDeal.stage}
                  onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Other'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleAddDeal} disabled={!newDeal.entrepreneurId || !newDeal.amount}>
                  Add Deal
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
