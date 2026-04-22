import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Building2, UserCircle, BarChart3, Briefcase } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [investor, setInvestor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/users/${id}`)
      .then(({ data }) => setInvestor(data.user))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading profile...</div>;

  if (!investor || investor.role !== 'investor') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
        <Link to="/dashboard/entrepreneur">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const currentId = (currentUser as any)?._id || (currentUser as any)?.id;
  const isCurrentUser = currentId === (investor._id || investor.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="xl"
              status={investor.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{investor.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Investor • {investor.totalInvestments || 0} investments
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {(investor.investmentStage || []).map((stage: string, i: number) => (
                  <Badge key={i} variant="secondary" size="sm">{stage}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <Link to={`/chat/${investor._id}`}>
                <Button leftIcon={<MessageCircle size={18} />}>Message</Button>
              </Link>
            )}
            {isCurrentUser && (
              <Link to="/settings">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit Profile</Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody><p className="text-gray-700">{investor.bio || 'No bio provided.'}</p></CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Interests</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                {investor.investmentInterests?.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-900">Industries</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {investor.investmentInterests.map((interest: string, i: number) => (
                        <Badge key={i} variant="primary" size="md">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {investor.investmentStage?.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-900">Investment Stages</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {investor.investmentStage.map((stage: string, i: number) => (
                        <Badge key={i} variant="secondary" size="md">{stage}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-md font-medium text-gray-900">Investment Criteria</h3>
                  <ul className="mt-2 space-y-2 text-gray-700">
                    {[
                      'Strong founding team with domain expertise',
                      'Clear market opportunity and product-market fit',
                      'Scalable business model with strong unit economics',
                      'Potential for significant growth and market impact',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {investor.portfolioCompanies?.length > 0 && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Portfolio Companies</h2>
                <span className="text-sm text-gray-500">{investor.portfolioCompanies.length} companies</span>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {investor.portfolioCompanies.map((company: string, i: number) => (
                    <div key={i} className="flex items-center p-3 border border-gray-200 rounded-md">
                      <div className="p-3 bg-primary-50 rounded-md mr-3">
                        <Briefcase size={18} className="text-primary-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{company}</h3>
                        <p className="text-xs text-gray-500">Portfolio company</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Details</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                {(investor.minimumInvestment || investor.maximumInvestment) && (
                  <div>
                    <span className="text-sm text-gray-500">Investment Range</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {investor.minimumInvestment} – {investor.maximumInvestment}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Total Investments</span>
                  <p className="text-md font-medium text-gray-900">{investor.totalInvestments || 0} companies</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Typical Timeline</span>
                  <p className="text-md font-medium text-gray-900">3–5 years</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Stats</h2></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { label: 'Portfolio Size', value: investor.portfolioCompanies?.length || 0 },
                  { label: 'Total Investments', value: investor.totalInvestments || 0 },
                  { label: 'Active Stages', value: investor.investmentStage?.length || 0 },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{stat.label}</h3>
                        <p className="text-xl font-semibold text-primary-700 mt-1">{stat.value}</p>
                      </div>
                      <BarChart3 size={24} className="text-primary-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
