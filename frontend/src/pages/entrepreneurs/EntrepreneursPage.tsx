import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const EntrepreneursPage: React.FC = () => {
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingRange, setSelectedFundingRange] = useState<string[]>([]);

  useEffect(() => {
    const fetchEntrepreneurs = async () => {
      try {
        const { data } = await api.get('/users/entrepreneurs');
        setEntrepreneurs(data.entrepreneurs || []);
      } catch {
        toast.error('Failed to load entrepreneurs');
      } finally {
        setLoading(false);
      }
    };
    fetchEntrepreneurs();
  }, []);

  const allIndustries = [...new Set(entrepreneurs.map((e) => e.industry).filter(Boolean))];
  const fundingRanges = ['< $500K', '$500K - $1M', '$1M - $5M', '> $5M'];

  const filteredEntrepreneurs = entrepreneurs.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.startupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.pitchSummary?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      !selectedIndustries.length || selectedIndustries.includes(e.industry);

    const matchesFunding =
      !selectedFundingRange.length ||
      selectedFundingRange.some((range) => {
        const amount = parseInt((e.fundingNeeded || '').replace(/[^0-9]/g, ''));
        if (range === '< $500K') return amount < 500;
        if (range === '$500K - $1M') return amount >= 500 && amount <= 1000;
        if (range === '$1M - $5M') return amount > 1000 && amount <= 5000;
        if (range === '> $5M') return amount > 5000;
        return true;
      });

    return matchesSearch && matchesIndustry && matchesFunding;
  });

  const toggleIndustry = (industry: string) =>
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );

  const toggleFundingRange = (range: string) =>
    setSelectedFundingRange((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Industry</h3>
                <div className="space-y-2">
                  {allIndustries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => toggleIndustry(ind)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedIndustries.includes(ind)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Funding Range</h3>
                <div className="space-y-2">
                  {fundingRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => toggleFundingRange(range)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedFundingRange.includes(range)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <div className="space-y-2">
                  {['San Francisco, CA', 'New York, NY', 'Boston, MA'].map((loc) => (
                    <button
                      key={loc}
                      className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <MapPin size={16} className="mr-2" />
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search startups by name, industry, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {filteredEntrepreneurs.length} results
              </span>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-12 text-gray-500">Loading startups...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEntrepreneurs.map((entrepreneur) => (
                <EntrepreneurCard key={entrepreneur._id} entrepreneur={entrepreneur} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
