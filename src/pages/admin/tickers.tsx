import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useToast } from "../../hooks/use-toast";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { Plus, Edit, Trash2, TrendingUp, BarChart3, Search, RefreshCw, Coins } from "lucide-react";

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NewTicker {
  symbol: string;
  description: string;
  category: string;
  isEnabled: boolean;
}

export default function TickersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [newTicker, setNewTicker] = useState<NewTicker>({
    symbol: '',
    description: '',
    category: 'cryptocurrency',
    isEnabled: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tickers
  const { data: tickers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/tickers'],
    queryFn: () => apiRequest('/api/admin/tickers')
  });

  // Create ticker mutation
  const createMutation = useMutation({
    mutationFn: (ticker: NewTicker) => {
      // Transform to snake_case for backend
      const payload = {
        symbol: ticker.symbol,
        description: ticker.description,
        category: ticker.category,
        is_enabled: ticker.isEnabled
      };
      return apiRequest('/api/admin/tickers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickers'] });
      refetch(); // Force immediate refresh
      setShowCreateDialog(false);
      setNewTicker({
        symbol: '',
        description: '',
        category: 'cryptocurrency',
        isEnabled: true
      });
      toast({
        title: "✅ Ticker Created Successfully!",
        description: `${data.ticker?.symbol || 'Ticker'} has been added to the database`,
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create ticker";
      
      // Handle specific error cases
      if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
        errorMessage = "This ticker symbol already exists. Try a different symbol or edit the existing one.";
      } else if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        errorMessage = "You must be logged in as admin. Please login and try again.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Network error. Check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Failed to Create Ticker",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Update ticker mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Ticker> }) => {
      // Transform to snake_case for backend - include id in body per API guide
      const payload: any = { id };
      if (updates.symbol !== undefined) payload.symbol = updates.symbol;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.isEnabled !== undefined) payload.is_enabled = updates.isEnabled;
      
      return apiRequest(`/api/admin/tickers`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickers'] });
      refetch(); // Force immediate refresh
      setShowEditDialog(false);
      setSelectedTicker(null);
      toast({
        title: "✅ Ticker Updated Successfully!",
        description: "Changes have been saved to the database"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticker",
        variant: "destructive"
      });
    }
  });

  // Delete ticker mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/tickers`, {
        method: 'DELETE',
        body: JSON.stringify({ id })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickers'] });
      refetch(); // Force immediate refresh
      toast({
        title: "✅ Ticker Deleted Successfully!",
        description: "Ticker has been removed from the database"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticker",
        variant: "destructive"
      });
    }
  });

  const filteredTickers = tickers.filter((ticker: Ticker) =>
    ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticker.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticker.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTickers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickers = filteredTickers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Clamp page index when data changes
  useEffect(() => {
    setCurrentPage(p => Math.min(Math.max(p, 1), Math.max(totalPages, 1)));
  }, [totalPages]);

  const enabledTickers = tickers.filter((ticker: Ticker) => ticker.isEnabled).length;
  const totalTickers = tickers.length;

  const handleCreateTicker = () => {
    // Enhanced validation
    if (!newTicker.symbol.trim()) {
      toast({
        title: "Validation Error",
        description: "Symbol is required (e.g., BTCUSDT)",
        variant: "destructive"
      });
      return;
    }
    
    if (!newTicker.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required (e.g., Bitcoin)",
        variant: "destructive"
      });
      return;
    }
    
    // Check for spaces in symbol
    if (newTicker.symbol.includes(' ')) {
      toast({
        title: "Validation Error",
        description: "Symbol cannot contain spaces. Use BTCUSDT not BTC USDT",
        variant: "destructive"
      });
      return;
    }
    
    createMutation.mutate(newTicker);
  };

  const handleUpdateTicker = (updates: Partial<Ticker>) => {
    if (!selectedTicker) return;
    updateMutation.mutate({ id: selectedTicker.id, updates });
  };

  const handleDeleteTicker = (id: string) => {
    if (confirm('Are you sure you want to delete this ticker?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (ticker: Ticker) => {
    setSelectedTicker(ticker);
    setShowEditDialog(true);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar className="hidden lg:block lg:w-64" />
          <div className="flex-1 lg:ml-64 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-destructive">Failed to Load Tickers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {(error as any)?.message || "Unable to fetch ticker data. Please check your connection and try again."}
                </p>
                <Button onClick={() => refetch()} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Ticker Management" 
            subtitle="Manage trading symbols and their configurations"
          >
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
              className="mr-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-ticker">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ticker
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Ticker</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      data-testid="input-ticker-symbol"
                      value={newTicker.symbol}
                      onChange={(e) => setNewTicker(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                      placeholder="e.g. BTCUSDT"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      data-testid="input-ticker-description"
                      value={newTicker.description}
                      onChange={(e) => setNewTicker(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Bitcoin / Tether USD"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTicker.category} onValueChange={(value) => setNewTicker(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                        <SelectItem value="commodities">Commodities</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={newTicker.isEnabled}
                      onCheckedChange={(checked) => setNewTicker(prev => ({ ...prev, isEnabled: checked }))}
                    />
                    <Label htmlFor="enabled">Enable immediately</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    data-testid="button-create-ticker"
                    onClick={handleCreateTicker}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Ticker"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Tickers
                  </CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalTickers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Symbols managed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Enabled
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {enabledTickers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Active tickers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Disabled
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {totalTickers - enabledTickers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Inactive tickers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Enable Rate
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {totalTickers > 0 ? Math.round((enabledTickers / totalTickers) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Active ratio</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tickers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tickers ({filteredTickers.length})</span>
                  {filteredTickers.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {Math.round((enabledTickers / totalTickers) * 100)}% Enabled
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading tickers...</p>
                  </div>
                ) : filteredTickers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Coins className="h-12 w-12 mx-auto mb-4" />
                    <p>No tickers found</p>
                    {searchTerm && (
                      <p className="text-sm mt-2">Try adjusting your search terms</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Mobile Card View (hidden on lg+) */}
                    <div className="lg:hidden p-4 space-y-4">
                      {paginatedTickers.map((ticker: Ticker) => (
                        <Card key={ticker.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-lg">{ticker.symbol}</p>
                                <p className="text-sm text-muted-foreground">{ticker.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(ticker)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteTicker(ticker.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Badge variant="outline">{ticker.category}</Badge>
                              <Badge 
                                variant={ticker.isEnabled ? "default" : "secondary"}
                              >
                                {ticker.isEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              Created: {new Date(ticker.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View (hidden on mobile) */}
                    <div className="hidden lg:block">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium text-muted-foreground">Symbol</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTickers.map((ticker: Ticker) => (
                            <tr key={ticker.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-lg font-mono">{ticker.symbol}</div>
                              </td>
                              <td className="p-4">
                                <div>{ticker.description}</div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="capitalize">{ticker.category}</Badge>
                              </td>
                              <td className="p-4">
                                <Badge 
                                  variant={ticker.isEnabled ? "default" : "secondary"}
                                >
                                  {ticker.isEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {new Date(ticker.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(ticker)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteTicker(ticker.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            {filteredTickers.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground" data-testid="text-pagination-summary">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredTickers.length)} of {filteredTickers.length} tickers
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        data-testid="button-previous-page"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current page
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, index, array) => {
                            const prevPage = array[index - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;
                            
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && (
                                  <span className="px-2 text-muted-foreground">...</span>
                                )}
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  data-testid={`button-page-${page}`}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            );
                          })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Ticker</DialogTitle>
                </DialogHeader>
                {selectedTicker && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-symbol">Symbol</Label>
                      <Input
                        id="edit-symbol"
                        value={selectedTicker.symbol}
                        onChange={(e) => setSelectedTicker(prev => prev ? { ...prev, symbol: e.target.value.toUpperCase() } : null)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        value={selectedTicker.description}
                        onChange={(e) => setSelectedTicker(prev => prev ? { ...prev, description: e.target.value } : null)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select 
                        value={selectedTicker.category} 
                        onValueChange={(value) => setSelectedTicker(prev => prev ? { ...prev, category: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                          <SelectItem value="forex">Forex</SelectItem>
                          <SelectItem value="stocks">Stocks</SelectItem>
                          <SelectItem value="commodities">Commodities</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-enabled"
                        checked={selectedTicker.isEnabled}
                        onCheckedChange={(checked) => setSelectedTicker(prev => prev ? { ...prev, isEnabled: checked } : null)}
                      />
                      <Label htmlFor="edit-enabled">Enabled</Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    onClick={() => selectedTicker && handleUpdateTicker(selectedTicker)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Updating..." : "Update Ticker"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}