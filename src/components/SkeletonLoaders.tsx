// components/SkeletonLoaders.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const SkeletonCard = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </CardContent>
  </Card>
)

export const SkeletonExerciseCard = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Skeleton className="h-3 w-12 mb-1" />
          <Skeleton className="h-6 w-8" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div>
          <Skeleton className="h-3 w-10 mb-1" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div>
          <Skeleton className="h-3 w-14 mb-1" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const SkeletonClientCard = () => (
  <div className="border rounded-lg p-4">
    <div className="flex items-start space-x-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2 mb-1" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  </div>
)