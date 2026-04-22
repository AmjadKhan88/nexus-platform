import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, PlusCircle, Search, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [entRes, collabRes] = await Promise.all([
          api.get('/users/entrepreneurs'),
          api.get('/collaborations'),
        ]);
        setEntrepreneurs(entRes.data.entrepreneurs || []);
        setSentRequests(collabRes.data.requests || []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user) return null;

  const industries = [...new Set(entrepreneurs.map((e: any) => e.industry).filter(Boolean))];

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const filteredEntrepreneurs = entrepreneurs.filter((e: any) => {
    const matchesSearch =
      !searchQuery ||
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.startupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = !selectedIndustries.length || selectedIndustries.includes(e.industry);
    return matchesSearch && matchesIndustry;
  });

  const acceptedConnections = sentRequests.filter((r) => r.status === 'accepted').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button>
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>
        <div className="w-full md:w-1/3 flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-gray-500" />
          {industries.map((ind) => (
            <Badge
              key={ind}
              variant={selectedIndustries.includes(ind) ? 'primary' : 'gray'}
              className="cursor-pointer"
              onClick={() => toggleIndustry(ind)}
            >
              {ind}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{loading ? '...' : entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">{loading ? '...' : acceptedConnections}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Entrepreneurs grid */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading startups...</p>
          ) : filteredEntrepreneurs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntrepreneurs.map((entrepreneur) => (
                <EntrepreneurCard key={entrepreneur._id} entrepreneur={entrepreneur} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No startups match your filters</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => { setSearchQuery(''); setSelectedIndustries([]); }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
