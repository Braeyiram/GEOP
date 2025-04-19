import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: any[];
  type: 'area' | 'line' | 'bar';
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  showTooltip?: boolean;
}

export function Chart({ 
  data, 
  type, 
  dataKey, 
  xAxisKey = 'name',
  color = '#0078D4', 
  height = 100,
  showGrid = false,
  showAxis = false,
  showTooltip = true
}: ChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && <XAxis dataKey={xAxisKey} />}
            {showAxis && <YAxis />}
            {showTooltip && <Tooltip />}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={`${color}20`} // 20% opacity
            />
          </AreaChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && <XAxis dataKey={xAxisKey} />}
            {showAxis && <YAxis />}
            {showTooltip && <Tooltip />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2} 
              dot={{ r: 3, fill: color }}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && <XAxis dataKey={xAxisKey} />}
            {showAxis && <YAxis />}
            {showTooltip && <Tooltip />}
            <Bar 
              dataKey={dataKey} 
              fill={color} 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
}

// Simulated data generator for demo purposes
export function generateChartData(points = 10, min = 10, max = 100, type: 'increasing' | 'decreasing' | 'fluctuating' = 'fluctuating') {
  const data = [];
  let value = Math.floor(Math.random() * (max - min) + min);

  for (let i = 0; i < points; i++) {
    let change;
    
    switch (type) {
      case 'increasing':
        change = Math.random() * 10;
        break;
      case 'decreasing':
        change = -Math.random() * 10;
        break;
      case 'fluctuating':
      default:
        change = Math.random() * 20 - 10;
        break;
    }
    
    value = Math.max(min, Math.min(max, value + change));
    
    data.push({
      name: `Point ${i}`,
      value: Math.floor(value)
    });
  }

  return data;
}
