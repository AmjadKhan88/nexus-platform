import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MapPin, Users, DollarSign } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EntrepreneurCardProps {
  entrepreneur: any;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true,
}) => {
  const id = entrepreneur._id || entrepreneur.id;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardBody className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link to={`/profile/entrepreneur/${id}`}>
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="lg"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="flex-shrink-0 cursor-pointer"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link to={`/profile/entrepreneur/${id}`} className="hover:text-primary-600">
              <h3 className="text-base font-semibold text-gray-900 truncate">{entrepreneur.name}</h3>
            </Link>
            {entrepreneur.startupName && (
              <p className="text-sm font-medium text-primary-600 truncate">{entrepreneur.startupName}</p>
            )}
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {entrepreneur.pitchSummary || entrepreneur.bio || 'Entrepreneur'}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {entrepreneur.industry && (
            <Badge variant="primary" size="sm">{entrepreneur.industry}</Badge>
          )}
          {entrepreneur.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />{entrepreneur.location}
            </span>
          )}
          {entrepreneur.teamSize && (
            <span className="flex items-center gap-1">
              <Users size={12} />{entrepreneur.teamSize} people
            </span>
          )}
          {entrepreneur.fundingNeeded && (
            <span className="flex items-center gap-1">
              <DollarSign size={12} />{entrepreneur.fundingNeeded}
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <Link to={`/profile/entrepreneur/${id}`} className="flex-1">
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
