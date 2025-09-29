import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Filter,
  RefreshCw,
  Target
} from 'lucide-react';

interface AlertSignal {
  id: string;
  userId: string | null;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  strategy?: string;
  source: string;
  note?: string;
  createdAt: string;
}

interface AlertsTableProps {
  onRowClick?: (alert: AlertSignal) => void;
  selectedAlertId?: string | null;
  className?: string;
}

const ITEMS_PER_PAGE = 10;
const SORT_OPTIONS = [
  { value: 'timestamp_desc', label: 'Latest First' },
  { value: 'timestamp_asc', label: 'Oldest First' },
  { value: 'price_desc', label: 'Price High to Low' },
  { value: 'price_asc', label: 'Price Low to High' },
  { value: 'ticker_asc', label: 'Ticker A-Z' },
  { value: 'ticker_desc', label: 'Ticker Z-A' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Signals' },
  { value: 'buy', label: 'Buy Signals' },
  { value: 'sell', label: 'Sell Signals' },
];

export default function AlertsTable({ 
  onRowClick, 
  selectedAlertId, 
  className = '' 
}: AlertsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('timestamp_desc');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch alerts data
  const { data: alertsData, isLoading, refetch } = useQuery<{alerts: AlertSignal[], total: number}>({
    queryKey: ['/api/signals', { page: currentPage, sort: sortBy, filter: filterBy, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sort: sortBy,
        ...(filterBy !== 'all' && { signal_type: filterBy }),
        ...(searchQuery && { search: searchQuery })
      });
      
      const response = await fetch(`/api/signals/all?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const alerts = alertsData?.alerts || [];
  const totalAlerts = alertsData?.total || 0;
  const totalPages = Math.ceil(totalAlerts / ITEMS_PER_PAGE);

  // Memoized filtered and sorted alerts for client-side operations
  const processedAlerts = useMemo(() => {
    let filtered = alerts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(alert => 
        alert.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.strategy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.note?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply signal type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(alert => alert.signalType === filterBy);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp_desc':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'timestamp_asc':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'price_desc':
          return b.price - a.price;
        case 'price_asc':
          return a.price - b.price;
        case 'ticker_asc':
          return a.ticker.localeCompare(b.ticker);
        case 'ticker_desc':
          return b.ticker.localeCompare(a.ticker);
        default:
          return 0;
      }
    });
  }, [alerts, searchQuery, filterBy, sortBy]);

  const handleRowClick = (alert: AlertSignal) => {
    onRowClick?.(alert);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getSignalIcon = (signalType: string) => {
    return signalType === 'buy' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Trading Signals
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              View and analyze all trading signals with real-time updates
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticker, source, or strategy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signal</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedAlerts.map((alert) => (
                  <TableRow 
                    key={alert.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedAlertId === alert.id ? 'bg-muted ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleRowClick(alert)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSignalIcon(alert.signalType)}
                        <Badge 
                          variant={alert.signalType === 'buy' ? 'default' : 'destructive'}
                          className="font-medium"
                        >
                          {alert.signalType.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {alert.ticker}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${alert.price.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 8 
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {alert.timeframe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {alert.source}
                    </TableCell>
                    <TableCell className="text-sm">
                      {alert.strategy || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(alert.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(alert);
                        }}
                      >
                        View Chart
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {processedAlerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || filterBy !== 'all' 
                          ? 'No signals match your filters' 
                          : 'No trading signals found'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalAlerts)} of{' '}
                  {totalAlerts} signals
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = currentPage <= 3 
                        ? i + 1 
                        : currentPage >= totalPages - 2 
                        ? totalPages - 4 + i 
                        : currentPage - 2 + i;
                      
                      if (page < 1 || page > totalPages) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}