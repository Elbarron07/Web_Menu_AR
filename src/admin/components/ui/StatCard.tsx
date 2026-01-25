import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  trend?: { value: string; direction: 'up' | 'down' };
  onClick?: () => void;
}

export const StatCard = ({ label, value, icon: Icon, iconColor, trend, onClick }: StatCardProps) => {
  const isClickable = !!onClick;
  
  return (
    <Card 
      variant="default" 
      padding="md" 
      hover={isClickable}
      onClick={onClick}
      className={isClickable ? 'cursor-pointer' : ''}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconColor} p-3 rounded-xl shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <Badge 
            variant={trend.direction === 'up' ? 'success' : 'error'} 
            size="sm"
            trend={trend.direction}
          >
            {trend.value}
          </Badge>
        )}
      </div>
      
      <motion.p 
        className="text-3xl font-bold text-gray-900 mb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.p>
      
      <p className="text-sm text-gray-600 font-medium">{label}</p>
    </Card>
  );
};
