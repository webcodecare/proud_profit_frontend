import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch as UISwitch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";

interface TickerTimeframeCombination {
  id: string;
  tickerSymbol: string;
  timeframe: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
}

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  isEnabled: boolean;
}

export default function AdminTickerCombinations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCombination, setEditingCombination] = useState<TickerTimeframeCombination | null>(null);
  const [newCombination, setNewCombination] = useState({
    tickerSymbol: "",
    timeframe: "",
    description: "",
    isEnabled: true,
  });

  // Available timeframes (as specified by the user)
  const timeframes = [
    { value: "4H", label: "4 Hour" },
    { value: "1D", label: "1 Day" },
    { value: "1W", label: "1 Week" },
  ];

  // Fetch existing combinations
  const { data: combinations, isLoading: isLoadingCombinations } = useQuery({
    queryKey: ["/api/admin/ticker-timeframes"],
  });

  // Fetch available tickers
  const { data: tickers } = useQuery({
    queryKey: ["/api/admin/tickers"],
  });

  const enabledTickers = tickers?.filter((ticker: Ticker) => ticker.isEnabled) || [];

  const createCombinationMutation = useMutation({
    mutationFn: async (combinationData: typeof newCombination) => {
      return await apiRequest("/api/admin/ticker-timeframes", {
        method: "POST",
        body: JSON.stringify(combinationData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ticker-timeframes"] });
      setNewCombination({ tickerSymbol: "", timeframe: "", description: "", isEnabled: true });
      setIsCreateOpen(false);
      toast({ title: "Combination created successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create combination", variant: "destructive" });
    },
  });

  const updateCombinationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TickerTimeframeCombination> }) => {
      return await apiRequest(`/api/admin/ticker-timeframes/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ticker-timeframes"] });
      toast({ title: "Combination updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update combination", variant: "destructive" });
    },
  });

  const deleteCombinationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/ticker-timeframes/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ticker-timeframes"] });
      toast({ title: "Combination deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to delete combination", variant: "destructive" });
    },
  });

  const editCombinationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TickerTimeframeCombination> }) => {
      return await apiRequest(`/api/admin/ticker-timeframes/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ticker-timeframes"] });
      setIsEditOpen(false);
      setEditingCombination(null);
      toast({ title: "Combination updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update combination", variant: "destructive" });
    },
  });

  const handleEditCombination = (combination: TickerTimeframeCombination) => {
    setEditingCombination(combination);
    setIsEditOpen(true);
  };

  const handleDeleteCombination = (id: string) => {
    if (confirm("Are you sure you want to delete this combination? This will affect user subscriptions.")) {
      deleteCombinationMutation.mutate(id);
    }
  };

  const filteredCombinations = combinations?.filter((combo: TickerTimeframeCombination) => 
    combo.tickerSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    combo.timeframe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    combo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const combinationStats = {
    total: combinations?.length || 0,
    enabled: combinations?.filter((c: TickerTimeframeCombination) => c.isEnabled).length || 0,
    disabled: combinations?.filter((c: TickerTimeframeCombination) => !c.isEnabled).length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="lg:ml-64 flex-1">
          {/* Mobile Header */}
          <div className="lg:hidden bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5" />
                <h1 className="text-lg font-bold">Signal Combinations</h1>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <header className="hidden lg:block bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6" />
                <div>
                  <h1 className="text-2xl font-bold">Ticker + Timeframe Combinations</h1>
                  <p className="text-sm text-muted-foreground">Control which ticker+timeframe combinations users can subscribe to</p>
                </div>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="crypto-gradient text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Combination
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Combination</DialogTitle>
                    <DialogDescription>
                      Create a new ticker + timeframe combination for users to subscribe to
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticker">Ticker Symbol</Label>
                      <Select 
                        value={newCombination.tickerSymbol} 
                        onValueChange={(value) => setNewCombination({ ...newCombination, tickerSymbol: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ticker..." />
                        </SelectTrigger>
                        <SelectContent>
                          {enabledTickers.map((ticker: Ticker) => (
                            <SelectItem key={ticker.id} value={ticker.symbol}>
                              {ticker.symbol} - {ticker.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeframe">Timeframe</Label>
                      <Select 
                        value={newCombination.timeframe} 
                        onValueChange={(value) => setNewCombination({ ...newCombination, timeframe: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeframe..." />
                        </SelectTrigger>
                        <SelectContent>
                          {timeframes.map((tf) => (
                            <SelectItem key={tf.value} value={tf.value}>
                              {tf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newCombination.description}
                        onChange={(e) => setNewCombination({ ...newCombination, description: e.target.value })}
                        placeholder="Bitcoin 4-hour signals"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <UISwitch
                        checked={newCombination.isEnabled}
                        onCheckedChange={(checked: boolean) => setNewCombination({ ...newCombination, isEnabled: checked })}
                      />
                      <Label>Enabled</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createCombinationMutation.mutate(newCombination)}
                      disabled={createCombinationMutation.isPending || !newCombination.tickerSymbol || !newCombination.timeframe}
                      className="crypto-gradient text-white"
                    >
                      Create Combination
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Combination Dialog */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Combination</DialogTitle>
                    <DialogDescription>
                      Update the combination information
                    </DialogDescription>
                  </DialogHeader>
                  {editingCombination && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-ticker">Ticker Symbol</Label>
                        <Select 
                          value={editingCombination.tickerSymbol} 
                          onValueChange={(value) => setEditingCombination({ ...editingCombination, tickerSymbol: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {enabledTickers.map((ticker: Ticker) => (
                              <SelectItem key={ticker.id} value={ticker.symbol}>
                                {ticker.symbol} - {ticker.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-timeframe">Timeframe</Label>
                        <Select 
                          value={editingCombination.timeframe} 
                          onValueChange={(value) => setEditingCombination({ ...editingCombination, timeframe: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeframes.map((tf) => (
                              <SelectItem key={tf.value} value={tf.value}>
                                {tf.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Input
                          id="edit-description"
                          value={editingCombination.description}
                          onChange={(e) => setEditingCombination({ ...editingCombination, description: e.target.value })}
                          placeholder="Bitcoin 4-hour signals"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <UISwitch
                          checked={editingCombination.isEnabled}
                          onCheckedChange={(checked: boolean) => setEditingCombination({ ...editingCombination, isEnabled: checked })}
                        />
                        <Label>Enabled</Label>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => editingCombination && editCombinationMutation.mutate({
                        id: editingCombination.id,
                        updates: {
                          tickerSymbol: editingCombination.tickerSymbol,
                          timeframe: editingCombination.timeframe,
                          description: editingCombination.description,
                          isEnabled: editingCombination.isEnabled
                        }
                      })}
                      disabled={editCombinationMutation.isPending}
                      className="crypto-gradient text-white"
                    >
                      {editCombinationMutation.isPending ? "Updating..." : "Update Combination"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Search and Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search combinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full lg:w-64"
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Total Combinations</div>
                  <div className="text-2xl font-bold">{combinationStats.total}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Enabled</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {combinationStats.enabled}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Disabled</div>
                  <div className="text-2xl font-bold text-red-400">
                    {combinationStats.disabled}
                  </div>
                </Card>
              </div>
            </div>

            {/* Combinations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Available Combinations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker Symbol</TableHead>
                      <TableHead>Timeframe</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCombinations ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading combinations...
                        </TableCell>
                      </TableRow>
                    ) : filteredCombinations?.map((combination: TickerTimeframeCombination) => (
                      <TableRow key={combination.id}>
                        <TableCell className="font-semibold font-mono">
                          {combination.tickerSymbol}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{combination.timeframe}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {combination.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <UISwitch
                              checked={combination.isEnabled}
                              onCheckedChange={(checked: boolean) =>
                                updateCombinationMutation.mutate({
                                  id: combination.id,
                                  updates: { isEnabled: checked },
                                })
                              }
                            />
                            <Badge variant={combination.isEnabled ? "default" : "secondary"}>
                              {combination.isEnabled ? (
                                <><CheckCircle className="mr-1 h-3 w-3" /> Enabled</>
                              ) : (
                                <><XCircle className="mr-1 h-3 w-3" /> Disabled</>
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(combination.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCombination(combination)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteCombination(combination.id)}
                              disabled={deleteCombinationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Quick Add Popular Combinations */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Add Popular Combinations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click to quickly add popular ticker + timeframe combinations
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { ticker: "BTCUSDT", timeframe: "4H", description: "Bitcoin 4-hour signals" },
                    { ticker: "BTCUSDT", timeframe: "1D", description: "Bitcoin daily signals" },
                    { ticker: "BTCUSDT", timeframe: "1W", description: "Bitcoin weekly signals" },
                    { ticker: "ETHUSDT", timeframe: "4H", description: "Ethereum 4-hour signals" },
                    { ticker: "ETHUSDT", timeframe: "1D", description: "Ethereum daily signals" },
                    { ticker: "ETHUSDT", timeframe: "1W", description: "Ethereum weekly signals" },
                  ].map((combo) => (
                    <Button
                      key={`${combo.ticker}-${combo.timeframe}`}
                      variant="outline"
                      className="h-20 flex-col justify-center"
                      onClick={() => {
                        setNewCombination({
                          tickerSymbol: combo.ticker,
                          timeframe: combo.timeframe,
                          description: combo.description,
                          isEnabled: true,
                        });
                        setIsCreateOpen(true);
                      }}
                    >
                      <div className="font-mono font-semibold">{combo.ticker}/{combo.timeframe}</div>
                      <div className="text-xs text-muted-foreground text-center">{combo.description}</div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}