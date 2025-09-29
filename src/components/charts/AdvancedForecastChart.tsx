import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Brain,
  Calculator,
  LineChart,
  PieChart,
  Waves,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface AdvancedForecastChartProps {
  ticker: string;
}

interface ForecastModel {
  name: string;
  accuracy: number;
  confidence: number;
  lastCalibrated: string;
  [key: string]: any;
}

interface ForecastData {
  date: string;
  predictedPrice: number;
  confidenceLow: number;
  confidenceHigh: number;
  modelType: string;
  marketRegime: string;
  cyclePhase: string;
  volatilityForecast: number;
  trendStrength: number;
  supportLevels: number[];
  resistanceLevels: number[];
}

export default function AdvancedForecastChart({ ticker }: AdvancedForecastChartProps) {
  const [selectedHorizon, setSelectedHorizon] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch model performance metrics
  const { data: modelMetricsData = [], isLoading: modelsLoading } = useQuery({
    queryKey: [`/api/public/forecast/models/${ticker}`],
  });
  
  // Ensure modelMetrics is always an array
  const modelMetrics = Array.isArray(modelMetricsData) ? modelMetricsData : [];

  // Generate forecast mutation
  const generateForecast = useMutation({
    mutationFn: async (horizon: number) => {
      setIsGenerating(true);
      console.log(`Generating forecast for ${ticker} with horizon ${horizon}`);
      const response = await apiRequest(`/api/public/forecast/advanced/${ticker}`, {
        method: "POST",
        body: JSON.stringify({ horizon })
      });
      console.log('Forecast response:', response);
      return response as any;
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      console.log('Forecast generation successful:', data);
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error('Forecast generation failed:', error);
    }
  });

  const forecastData = generateForecast.data?.forecast || [];
  const overallConfidence = generateForecast.data?.overallConfidence || 0;
  const models = generateForecast.data?.models || [];

  const handleGenerateForecast = () => {
    generateForecast.mutate(selectedHorizon);
  };

  const getModelIcon = (modelName: string) => {
    switch (modelName.toLowerCase()) {
      case 'fourier transform': return <Waves className="h-4 w-4" />;
      case 'elliott wave': return <Activity className="h-4 w-4" />;
      case 'gann analysis': return <Calculator className="h-4 w-4" />;
      case 'harmonic patterns': return <Target className="h-4 w-4" />;
      case 'fractal dimension': return <Brain className="h-4 w-4" />;
      case 'entropy analysis': return <BarChart3 className="h-4 w-4" />;
      default: return <LineChart className="h-4 w-4" />;
    }
  };

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'bull': return 'bg-green-500';
      case 'bear': return 'bg-red-500';
      case 'volatile': return 'bg-orange-500';
      case 'sideways': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCyclePhaseColor = (phase: string) => {
    switch (phase) {
      case 'accumulation': return 'bg-blue-500';
      case 'markup': return 'bg-green-500';
      case 'distribution': return 'bg-orange-500';
      case 'markdown': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Cycle Forecasting - {ticker.replace('USDT', '')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Forecast Horizon:</label>
              <select 
                value={selectedHorizon}
                onChange={(e) => setSelectedHorizon(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
            
            <Button 
              onClick={handleGenerateForecast}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Forecast'}
            </Button>
          </div>

          {overallConfidence > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Overall Confidence:</span>
                <Progress value={overallConfidence * 100} className="w-24" />
                <span className="text-sm text-muted-foreground">
                  {(overallConfidence * 100).toFixed(1)}%
                </span>
              </div>
              
              {generateForecast.data?.generatedAt && (
                <Badge variant="outline" className="text-xs">
                  Generated: {new Date(generateForecast.data.generatedAt).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Algorithm Models</TabsTrigger>
          <TabsTrigger value="forecast">Price Forecast</TabsTrigger>
          <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
          <TabsTrigger value="levels">Support/Resistance</TabsTrigger>
        </TabsList>

        {/* Algorithm Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelMetrics.map((model: ForecastModel, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getModelIcon(model.name)}
                      {model.name}
                    </div>
                    <Badge variant={model.accuracy > 0.75 ? "default" : "secondary"}>
                      {(model.accuracy * 100).toFixed(1)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <div className="flex items-center gap-2">
                      <Progress value={model.confidence * 100} className="w-16 h-2" />
                      <span className="text-xs">{(model.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Last Calibrated</span>
                    <div className="text-xs">
                      {new Date(model.lastCalibrated).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Model-specific metrics */}
                  {model.dominantCycles && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Dominant Cycles</span>
                      <div className="flex gap-1">
                        {model.dominantCycles.slice(0, 3).map((cycle: number, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cycle}d
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {model.currentWave && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Current Wave</span>
                      <Badge variant="secondary" className="text-xs">
                        Wave {model.currentWave}
                      </Badge>
                    </div>
                  )}

                  {model.detectedPatterns && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Patterns</span>
                      <div className="flex gap-1">
                        {model.detectedPatterns.map((pattern: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {model.regime && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Market Regime</span>
                      <Badge variant="secondary" className="text-xs">
                        {model.regime}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Price Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          {forecastData.length > 0 ? (
            <div className="space-y-4">
              {/* Forecast Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${forecastData[selectedHorizon - 1]?.predictedPrice?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedHorizon}-Day Target
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        ${forecastData[selectedHorizon - 1]?.confidenceLow?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Support Range</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        ${forecastData[selectedHorizon - 1]?.confidenceHigh?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Resistance Range</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold flex items-center justify-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRegimeColor(forecastData[0]?.marketRegime)}`} />
                        {forecastData[0]?.marketRegime || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">Market Regime</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Forecast Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Price Forecast Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {forecastData.slice(0, 14).map((forecast: ForecastData, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border-b">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            Day {index + 1}
                          </Badge>
                          <span className="text-sm">
                            {new Date(forecast.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">
                              ${forecast.predictedPrice?.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${forecast.confidenceLow?.toLocaleString()} - ${forecast.confidenceHigh?.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getCyclePhaseColor(forecast.cyclePhase)}`} />
                            <span className="text-xs">{forecast.cyclePhase}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Generate an advanced forecast to view price predictions
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {models.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map((model: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getModelIcon(model.name)}
                      {model.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {model.cycles && (
                      <div>
                        <span className="text-xs text-muted-foreground">Detected Cycles</span>
                        <div className="flex gap-1 mt-1">
                          {model.cycles.map((cycle: number, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {cycle} days
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {model.currentWave && (
                      <div>
                        <span className="text-xs text-muted-foreground">Elliott Wave Analysis</span>
                        <div className="mt-1">
                          <Badge variant="secondary">Wave {model.currentWave}</Badge>
                        </div>
                      </div>
                    )}

                    {model.patterns && (
                      <div>
                        <span className="text-xs text-muted-foreground">Harmonic Patterns</span>
                        <div className="flex gap-1 mt-1">
                          {model.patterns.map((pattern: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {model.regime && (
                      <div>
                        <span className="text-xs text-muted-foreground">Market Regime</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-3 h-3 rounded-full ${getRegimeColor(model.regime)}`} />
                          <span className="text-sm">{model.regime}</span>
                        </div>
                      </div>
                    )}

                    {typeof model.strength === 'number' && (
                      <div>
                        <span className="text-xs text-muted-foreground">Signal Strength</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={model.strength * 100} className="w-20 h-2" />
                          <span className="text-xs">{(model.strength * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Generate a forecast to view detailed market analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Support/Resistance Tab */}
        <TabsContent value="levels" className="space-y-4">
          {forecastData.length > 0 && forecastData[0]?.supportLevels ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Support Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {forecastData[0].supportLevels?.slice(0, 5).map((level: number, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="text-sm font-medium">Support {index + 1}</span>
                        <span className="font-mono">${level?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Resistance Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {forecastData[0].resistanceLevels?.slice(0, 5).map((level: number, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span className="text-sm font-medium">Resistance {index + 1}</span>
                        <span className="font-mono">${level?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Generate a forecast to view support and resistance levels
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}