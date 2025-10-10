import { lazy, Suspense, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyLoaderProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: any;
}

// Default loading skeleton
const DefaultSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-64 w-full" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  </div>
);

export function LazyLoader({ component, fallback, props }: LazyLoaderProps) {
  const LazyComponent = lazy(component);
  
  return (
    <Suspense fallback={fallback || <DefaultSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading<T extends object>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  return function LazyComponentWrapper(props: T) {
    return (
      <LazyLoader 
        component={loader} 
        fallback={fallback} 
        props={props} 
      />
    );
  };
}

export default LazyLoader;