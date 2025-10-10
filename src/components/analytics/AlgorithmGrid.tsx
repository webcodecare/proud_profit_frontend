import { Badge } from "@/components/ui/badge";

interface Algorithm {
  name: string;
  accuracy: string;
  status: string;
}

interface AlgorithmGridProps {
  algorithms: Algorithm[];
}

export default function AlgorithmGrid({ algorithms }: AlgorithmGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {algorithms.map((algo, index) => (
        <div key={index} className="p-3 border rounded-lg">
          <div className="font-medium text-xs sm:text-sm truncate">{algo.name}</div>
          <div className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">Accuracy: </span>
            {algo.accuracy}
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400 text-xs mt-1">
            {algo.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}