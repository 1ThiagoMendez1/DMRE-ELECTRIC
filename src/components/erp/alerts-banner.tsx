"use client";

import { useAlerts } from "@/components/providers/alerts-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AlertsBanner() {
    const { notifications, markAsRead } = useAlerts();
    const unread = notifications.filter(n => !n.isRead);

    if (unread.length === 0) return null;

    // Group by severity
    const critical = unread.filter(n => n.severity === 'CRITICAL');
    const high = unread.filter(n => n.severity === 'HIGH');
    const others = unread.filter(n => n.severity === 'MEDIUM' || n.severity === 'LOW');

    return (
        <div className="space-y-2">
            {critical.length > 0 && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="flex justify-between items-center">
                        Atención Requerida ({critical.length})
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        <ScrollArea className="h-[max-content] max-h-[100px]">
                            <ul className="list-disc pl-4 space-y-1">
                                {critical.map(n => (
                                    <li key={n.id} className="flex justify-between items-center gap-2 text-sm">
                                        <span>{n.message}</span>
                                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => markAsRead(n.id)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </AlertDescription>
                </Alert>
            )}
            {high.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800 dark:text-orange-200">advertencias Importantes ({high.length})</AlertTitle>
                    <AlertDescription className="mt-2 text-orange-700 dark:text-orange-300">
                        <ul className="list-disc pl-4 space-y-1">
                            {high.slice(0, 3).map(n => (
                                <li key={n.id} className="flex justify-between items-center gap-2 text-sm">
                                    <span>{n.message}</span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-orange-200" onClick={() => markAsRead(n.id)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </li>
                            ))}
                            {high.length > 3 && <li>... y {high.length - 3} más.</li>}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
