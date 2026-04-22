import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, TrendingUp } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InvestorCardProps {
  investor: any;
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({ investor, showActions = true }) => {
  const id = investor._id || investor.id;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardBody className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link to={`/profile/investor/${id}`}>
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="lg"
              status={investor.isOnline ? 'online' : 'offline'}
              className="flex-shrink-0 cursor-pointer"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link to={`/profile/investor/${id}`} className="hover:text-primary-600">
              <h3 className="text-base font-semibold text-gray-900 truncate">{investor.name}</h3>
            </Link>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {investor.bio || 'Investor'}
            </p>

            {/* Investment range */}
            {(investor.minimumInvestment || investor.maximumInvestment) && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <TrendingUp size={12} />
                <span>{investor.minimumInvestment} – {investor.maximumInvestment}</span>
              </div>
            )}
          </div>
        </div>

        {/* Investment stages */}
        {investor.investmentStage?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {investor.investmentStage.slice(0, 3).map((stage: string, i: number) => (
              <Badge key={i} variant="secondary" size="sm">{stage}</Badge>
            ))}
            {investor.investmentStage.length > 3 && (
              <Badge variant="gray" size="sm">+{investor.investmentStage.length - 3}</Badge>
            )}
          </div>
        )}

        {/* Interests */}
        {investor.investmentInterests?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {investor.investmentInterests.slice(0, 3).map((interest: string, i: number) => (
              <Badge key={i} variant="primary" size="sm">{interest}</Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <Link to={`/profile/investor/${id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">View Profile</Button>
            </Link>
            <Link to={`/chat/${id}`} className="flex-1">
              <Button size="sm" className="w-full" leftIcon={<MessageCircle size={14} />}>
                Message
              </Button>
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
