import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  chart: React.ReactNode;
}

export function MetricCard({ title, value, trend, chart }: MetricCardProps) {
  const isTrendPositive = trend >= 0;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        <div className="flex items-center mt-1 text-xs">
          <span className={isTrendPositive ? "text-green-600" : "text-red-600"}>
            {isTrendPositive ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-gray-500 ml-1">vs previous period</span>
        </div>
        
        <div className="chart-container mt-4 h-[100px]">
          {chart}
        </div>
      </CardContent>
    </Card>
  );
}
