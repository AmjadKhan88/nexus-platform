import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [entrepreneur, setEntrepreneur] = useState<any>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [userRes, collabRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/collaborations'),
        ]);
        setEntrepreneur(userRes.data.user);
        const alreadyRequested = (collabRes.data.requests || []).some(
          (r: any) => (r.entrepreneurId?._id || r.entrepreneurId) === id
        );
        setHasRequested(alreadyRequested);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSendRequest = async () => {
    if (!id) return;
    setRequesting(true);
    try {
      await api.post('/collaborations', {
        entrepreneurId: id,
        message: `I'm interested in learning more about ${entrepreneur?.startupName} and would like to explore potential investment opportunities.`,
      });
      setHasRequested(true);
      toast.success('Collaboration request sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading profile...</div>;

  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const currentId = (currentUser as any)?._id || (currentUser as any)?.id;
  const isCurrentUser = currentId === (entrepreneur._id || entrepreneur.id);
  const isInvestor = currentUser?.role === 'investor';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {entrepreneur.industry && <Badge variant="primary">{entrepreneur.industry}</Badge>}
                {entrepreneur.location && (
                  <Badge variant="gray">
                    <MapPin size={14} className="mr-1" />{entrepreneur.location}
                  </Badge>
                )}
                {entrepreneur.foundedYear && (
                  <Badge variant="accent">
                    <Calendar size={14} className="mr-1" />Founded {entrepreneur.foundedYear}
                  </Badge>
                )}
                {entrepreneur.teamSize && (
                  <Badge variant="secondary">
                    <Users size={14} className="mr-1" />{entrepreneur.teamSize} team members
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur._id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
                </Link>
                {isInvestor && (
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={hasRequested || requesting}
                    onClick={handleSendRequest}
                  >
                    {requesting ? 'Sending...' : hasRequested ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                )}
              </>
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
            <CardBody><p className="text-gray-700">{entrepreneur.bio || 'No bio provided.'}</p></CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Pitch Summary</h3>
                  <p className="text-gray-700 mt-1">{entrepreneur.pitchSummary || 'No pitch summary provided.'}</p>
                </div>
                {entrepreneur.industry && (
                  <div>
                    <h3 className="text-md font-medium text-gray-900">Market Opportunity</h3>
                    <p className="text-gray-700 mt-1">
                      The {entrepreneur.industry} market is experiencing significant growth. Our solution addresses key pain points in this expanding market.
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              {entrepreneur.teamSize && <span className="text-sm text-gray-500">{entrepreneur.teamSize} members</span>}
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar src={entrepreneur.avatarUrl} alt={entrepreneur.name} size="md" className="mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{entrepreneur.name}</h3>
                    <p className="text-xs text-gray-500">Founder & CEO</p>
                  </div>
                </div>
                {entrepreneur.teamSize > 1 && (
                  <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">+ {entrepreneur.teamSize - 1} more team members</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Funding Needed</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">{entrepreneur.fundingNeeded || 'TBD'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Industry</span>
                  <p className="text-md font-medium text-gray-900">{entrepreneur.industry || '—'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Founded</span>
                  <p className="text-md font-medium text-gray-900">{entrepreneur.foundedYear || '—'}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {!isCurrentUser && isInvestor && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Documents</h2></CardHeader>
              <CardBody>
                <p className="text-sm text-gray-500 mb-4">
                  Request access to detailed documents and financials by sending a collaboration request.
                </p>
                <Button
                  className="w-full"
                  disabled={hasRequested || requesting}
                  onClick={handleSendRequest}
                  leftIcon={<FileText size={16} />}
                >
                  {requesting ? 'Sending...' : hasRequested ? 'Request Sent' : 'Request Collaboration'}
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
