import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "default" | "wine" | "gold";
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
}: MetricCardProps) {
  return (
    <Card
      variant={variant === "wine" ? "wine" : variant === "gold" ? "gold" : "elevated"}
      className="group hover:scale-[1.02] transition-all duration-300"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-display font-bold tracking-tight">
              {value}
            </p>
            {change && (
              <p
                className={cn(
                  "text-sm font-medium flex items-center gap-1",
                  changeType === "positive" && "text-success",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {changeType === "positive" && "↑"}
                {changeType === "negative" && "↓"}
                {change}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
              variant === "wine" && "bg-wine/20 text-wine-light group-hover:bg-wine/30",
              variant === "gold" && "bg-gold/20 text-gold group-hover:bg-gold/30",
              variant === "default" && "bg-secondary text-muted-foreground group-hover:bg-wine/20 group-hover:text-wine-light"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
