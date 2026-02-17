import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ProgressItem {
  label: string
  value: number
  max: number
  color?: string
  showPercentage?: boolean
}

interface ProgressListCardProps {
  title: string
  description?: string
  items: ProgressItem[]
}

export function ProgressListCard({
  title,
  description,
  items
}: ProgressListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            const percentage = (item.value / item.max) * 100
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  {item.showPercentage !== false && (
                    <span className="text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{ 
                    ['--progress-background' as any]: item.color || 'hsl(var(--primary))' 
                  }}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.value}</span>
                  <span>{item.max}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
