import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";

interface SimulationSettings {
  initialBalance: number;
  riskPercentage: number;
  autoTrade: boolean;
  speed: number;
  selectedTicker: string;
}

interface SimulationControlsProps {
  settings: SimulationSettings;
  isRunning: boolean;
  onSettingsChange: (settings: Partial<SimulationSettings>) => void;
  onToggleSimulation: () => void;
  onReset: () => void;
}

export default function SimulationControls({
  settings,
  isRunning,
  onSettingsChange,
  onToggleSimulation,
  onReset
}: SimulationControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Simulation Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="balance">Initial Balance ($)</Label>
            <Input
              id="balance"
              type="number"
              value={settings.initialBalance}
              onChange={(e) => onSettingsChange({ initialBalance: Number(e.target.value) })}
              min="1000"
              max="1000000"
              step="1000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="risk">Risk per Trade (%)</Label>
            <Input
              id="risk"
              type="number"
              value={settings.riskPercentage}
              onChange={(e) => onSettingsChange({ riskPercentage: Number(e.target.value) })}
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticker">Trading Pair</Label>
          <Select value={settings.selectedTicker} onValueChange={(value) => onSettingsChange({ selectedTicker: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select trading pair" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
              <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
              <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-trade">Auto Trading</Label>
          <Switch
            id="auto-trade"
            checked={settings.autoTrade}
            onCheckedChange={(checked) => onSettingsChange({ autoTrade: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="speed">Simulation Speed: {settings.speed}x</Label>
          <Input
            id="speed"
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={settings.speed}
            onChange={(e) => onSettingsChange({ speed: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onToggleSimulation}
            className={`flex-1 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isRunning ? 'Pause' : 'Start'} Simulation
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}