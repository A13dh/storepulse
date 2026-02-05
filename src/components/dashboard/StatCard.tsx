
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="rounded-full bg-blue-100 p-2 text-[#1132d4]">
                        <Icon size={16} />
                    </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <div className="text-2xl font-bold">{value}</div>
                </div>
                {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
            </CardContent>
        </Card>
    );
}
