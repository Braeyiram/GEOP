import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string;
  status: 'operational' | 'degraded' | 'offline';
  icon: React.ReactNode;
  subValue?: string;
  subLabel?: string;
  className?: string;
}

const statusColors = {
  operational: 'border-green-500 text-green-600',
  degraded: 'border-amber-500 text-amber-600',
  offline: 'border-red-500 text-red-600'
};

const statusIcons = {
  operational: 'text-green-500',
  degraded: 'text-amber-500',
  offline: 'text-red-500'
};

const backgroundColors = {
  operational: 'bg-green-50',
  degraded: 'bg-amber-50',
  offline: 'bg-red-50'
};

export function StatisticCard({
  title,
  value,
  icon,
  status,
  subValue,
  subLabel,
  className
}: StatusCardProps) {
  return (
    <Card className={cn("border-l-4", statusColors[status], className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="text-2xl font-semibold flex items-center mt-1">
              <span className={statusColors[status]}>{value}</span>
            </div>
          </div>
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", backgroundColors[status])}>
            <div className={statusIcons[status]}>
              {icon}
            </div>
          </div>
        </div>
        {(subValue || subLabel) && (
          <div className="mt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{subLabel}</span>
              <span className="font-medium">{subValue}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
