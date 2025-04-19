import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopNavigation } from "@/components/layout/top-navigation";
import { StatisticCard } from "@/components/ui/statistic-card";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { Chart, generateChartData } from "@/components/ui/chart";
import { 
  Globe, 
  Send as SendIcon, 
  Code, 
  CheckCircle, 
  AlertTriangle, 
  XCircle 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { getEmailStats, getHealthStatus, getSmtpProviders } from "@/lib/api";
import type { EmailStats, SystemMetrics } from "@/types";

export default function Dashboard() {
  const { lastMessage, isConnected } = useWebSocket();
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 42,
    memory: 68,
    storage: 32,
    network: 56
  });
  const [regionTimeframe, setRegionTimeframe] = useState("volume");
  const [systemRegion, setSystemRegion] = useState("All Regions");
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // Initial data fetch
  const { data: initialStats } = useQuery({ 
    queryKey: ['/api/email/stats'],
    staleTime: 60000
  });

  const { data: healthStatus } = useQuery({ 
    queryKey: ['/api/health'],
    queryFn: getHealthStatus,
    staleTime: 60000
  });

  const { data: smtpProviders } = useQuery({ 
    queryKey: ['/api/smtp'],
    queryFn: getSmtpProviders,
    staleTime: 60000
  });

  // Update state from WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'dashboardUpdate') {
        setEmailStats(lastMessage.stats);
        setLastUpdated(lastMessage.timestamp);
      } else if (lastMessage.type === 'systemMetricsUpdate') {
        setSystemMetrics(lastMessage.metrics);
      }
    }
  }, [lastMessage]);

  // Use initial data if no WebSocket data yet
  useEffect(() => {
    if (initialStats && !emailStats) {
      setEmailStats(initialStats);
    }
  }, [initialStats, emailStats]);

  // Generate chart data for metrics
  const chartData = {
    sent: generateChartData(10, 10, 100, 'increasing'),
    delivery: generateChartData(10, 80, 100, 'fluctuating'),
    open: generateChartData(10, 10, 40, 'decreasing'),
    click: generateChartData(10, 1, 10, 'fluctuating')
  };

  // System status components
  const getStatusIndicator = (status: string) => {
    if (status === 'operational' || status === 'Operational') {
      return { 
        status: 'operational' as const, 
        label: 'Operational',
        icon: <CheckCircle className="h-5 w-5" />
      };
    } else if (status === 'degraded' || status === 'Degraded') {
      return { 
        status: 'degraded' as const, 
        label: 'Degraded',
        icon: <AlertTriangle className="h-5 w-5" />
      };
    }
    return { 
      status: 'offline' as const, 
      label: 'Offline',
      icon: <XCircle className="h-5 w-5" />
    };
  };

  const apiStatusIndicator = getStatusIndicator(
    healthStatus?.services?.email === 'operational' ? 'operational' : 'degraded'
  );

  // Format metrics for display
  const formatMetric = (value: number | undefined, suffix: string = '') => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(1)}${suffix}`;
  };

  // API endpoints data
  const apiEndpoints = [
    { name: '/api/v1/send', method: 'POST', requests: '2.3M', responseTime: 239, status: 'operational' },
    { name: '/api/v1/templates', method: 'GET', requests: '1.1M', responseTime: 186, status: 'operational' },
    { name: '/api/v1/analytics', method: 'GET', requests: '842K', responseTime: 412, status: 'degraded' },
    { name: '/api/v1/webhooks', method: 'POST', requests: '632K', responseTime: 128, status: 'operational' }
  ];

  // Activity log data
  const activityLogs = [
    { timestamp: '2023-06-15 14:28:12', event: 'API Response Time Degradation', service: 'analytics-service', region: 'EU', status: 'warning' },
    { timestamp: '2023-06-15 14:15:36', event: 'Auto-scaling Triggered', service: 'email-processing', region: 'NA', status: 'info' },
    { timestamp: '2023-06-15 14:02:45', event: 'Template Rendering Error', service: 'render-service', region: 'APAC', status: 'error' },
    { timestamp: '2023-06-15 13:58:21', event: 'Rate Limit Adjusted', service: 'rate-limiter', region: 'Global', status: 'success' },
    { timestamp: '2023-06-15 13:45:09', event: 'SMTP Connection Recovered', service: 'smtp-service', region: 'EU', status: 'success' },
  ];

  return (
    <>
      <TopNavigation 
        title="Dashboard" 
        subtitle="Email Infrastructure Overview" 
      />
      
      <main className="p-4 sm:p-6 lg:p-8">
        {/* System Status Overview */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between">
            <h2 className="text-lg font-semibold">System Status</h2>
            <div className="flex items-center">
              <span className="text-sm text-gray-400 mr-2">Last updated:</span>
              <span className="text-sm font-medium">
                {new Date(lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatisticCard
              title="All Regions"
              value="Operational"
              status="operational"
              icon={<Globe className="h-5 w-5" />}
              subLabel="Uptime (30 days)"
              subValue="99.999%"
            />
            
            <StatisticCard
              title="Email Processing"
              value="Optimal"
              status="operational"
              icon={<SendIcon className="h-5 w-5" />}
              subLabel="Avg. Delivery Time"
              subValue="1.2s"
            />
            
            <StatisticCard
              title="API Endpoints"
              value={apiStatusIndicator.label}
              status={apiStatusIndicator.status}
              icon={<Code className="h-5 w-5" />}
              subLabel="Response Time"
              subValue={
                apiStatusIndicator.status === 'operational' ? '212ms' : '412ms'
              }
            />
          </div>
        </div>
        
        {/* Email Performance Metrics */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between">
            <h2 className="text-lg font-semibold">Email Performance</h2>
            <div>
              <Select defaultValue="30">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Today</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Emails Sent"
              value={emailStats ? `${(emailStats.totalSent / 1000000).toFixed(1)}M` : "Loading..."}
              trend={14.2}
              chart={<Chart data={chartData.sent} type="area" dataKey="value" />}
            />
            
            <MetricCard
              title="Delivery Rate"
              value={emailStats ? `${emailStats.deliveryRate.toFixed(1)}%` : "Loading..."}
              trend={0.3}
              chart={<Chart data={chartData.delivery} type="area" dataKey="value" />}
            />
            
            <MetricCard
              title="Open Rate"
              value={emailStats ? `${emailStats.openRate.toFixed(1)}%` : "Loading..."}
              trend={-2.1}
              chart={<Chart data={chartData.open} type="area" dataKey="value" />}
            />
            
            <MetricCard
              title="Click Rate"
              value={emailStats ? `${emailStats.clickRate.toFixed(1)}%` : "Loading..."}
              trend={0.5}
              chart={<Chart data={chartData.click} type="area" dataKey="value" />}
            />
          </div>
        </div>
        
        {/* Regional Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Regional Performance</h3>
                  <div>
                    <Select value={regionTimeframe} onValueChange={setRegionTimeframe}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="delivery">Delivery Rate</SelectItem>
                        <SelectItem value="open">Open Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="h-64">
                  <div className="flex h-full items-end">
                    {emailStats?.regionData.map((region, index) => (
                      <div key={region.region} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className="text-xs font-medium mb-1">
                          {region.count > 1000000 ? 
                            `${(region.count / 1000000).toFixed(1)}M` : 
                            `${(region.count / 1000).toFixed(1)}K`}
                        </div>
                        <div 
                          className={`w-10 rounded-t-md ${index < 3 ? 'bg-primary' : 'bg-gray-300'}`} 
                          style={{ height: `${Math.max(5, region.percentage)}%` }}
                        ></div>
                        <div className="text-xs text-gray-400 mt-2">{region.region}</div>
                      </div>
                    ))}
                    
                    {/* If there's no data or less than 5 regions, show placeholders */}
                    {(!emailStats?.regionData || emailStats.regionData.length < 5) && (
                      Array(5 - (emailStats?.regionData.length || 0)).fill(0).map((_, i) => (
                        <div key={`placeholder-${i}`} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div className="text-xs font-medium mb-1">0</div>
                          <div className="w-10 bg-gray-300 rounded-t-md" style={{ height: "5%" }}></div>
                          <div className="text-xs text-gray-400 mt-2">-</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardContent className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold">SMTP Provider Usage</h3>
                </div>
                
                <div className="space-y-4">
                  {emailStats?.providerData.map(provider => (
                    <div key={provider.provider}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{provider.provider}</span>
                        <span className="text-xs text-gray-400">
                          {provider.count > 1000000 ? 
                            `${(provider.count / 1000000).toFixed(1)}M` : 
                            `${(provider.count / 1000).toFixed(1)}K`} 
                          ({provider.percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${provider.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  {/* If there's no data, show placeholders */}
                  {(!emailStats?.providerData || emailStats.providerData.length === 0) && (
                    Array(4).fill(0).map((_, i) => (
                      <div key={`placeholder-${i}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Provider {i+1}</span>
                          <span className="text-xs text-gray-400">0 (0%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total Messages</span>
                    <span className="font-medium">
                      {emailStats ? 
                        (emailStats.totalSent > 1000000 ? 
                          `${(emailStats.totalSent / 1000000).toFixed(1)}M` : 
                          `${(emailStats.totalSent / 1000).toFixed(1)}K`) : 
                        "0"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* API and System Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Performance */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">API Performance</h3>
                <Button variant="link" size="sm" className="text-xs text-primary">
                  View Details
                </Button>
              </div>
              
              <div className="space-y-3">
                {apiEndpoints.map((endpoint) => (
                  <div key={endpoint.name} className="flex items-center py-2 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{endpoint.name}</div>
                      <div className="text-xs text-gray-400">{endpoint.method} | {endpoint.requests} requests</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${endpoint.status === 'degraded' ? 'text-amber-500' : ''}`}>
                        {endpoint.responseTime}ms
                      </div>
                      <div className="text-xs text-gray-400">avg. response time</div>
                    </div>
                    <div className={`ml-4 h-2 w-2 rounded-full ${
                      endpoint.status === 'operational' ? 'bg-green-500' : 'bg-amber-500'
                    }`}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* System Resources */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">System Resources</h3>
                <div>
                  <Select value={systemRegion} onValueChange={setSystemRegion}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Regions">All Regions</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                      <SelectItem value="EU">EU</SelectItem>
                      <SelectItem value="APAC">APAC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-5">
                {/* CPU Usage */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">{systemMetrics.cpu}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full" 
                      style={{ width: `${systemMetrics.cpu}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Memory Usage */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">{systemMetrics.memory}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${systemMetrics.memory > 65 ? 'bg-amber-500' : 'bg-primary'} h-3 rounded-full`}
                      style={{ width: `${systemMetrics.memory}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Storage */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Storage</span>
                    <span className="text-sm font-medium">{systemMetrics.storage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full" 
                      style={{ width: `${systemMetrics.storage}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Network */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Network Throughput</span>
                    <span className="text-sm font-medium">{systemMetrics.network}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full" 
                      style={{ width: `${systemMetrics.network}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-sm">Active Instances</div>
                  <div className="text-lg font-semibold">24/32</div>
                </div>
                <Button variant="outline" className="px-3 py-1 text-primary bg-primary/10 hover:bg-primary/20 text-sm">
                  Scale Resources
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity Log */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">System Activity Log</h3>
                <Button variant="link" size="sm" className="text-xs text-primary">
                  View All Logs
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Service</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Region</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activityLogs.map((log, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-400">{log.timestamp}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{log.event}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{log.service}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{log.region}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.status === 'success' ? 'bg-green-100 text-green-600' :
                            log.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                            log.status === 'error' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
