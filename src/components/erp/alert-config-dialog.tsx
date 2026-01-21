"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Bell, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { useAlerts } from "@/components/providers/alerts-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertRule, AlertSeverity } from "@/types/alerts";

export function AlertConfigDialog() {
    const { rules, toggleRule, addRule, deleteRule, updateRule } = useAlerts();
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar Alertas
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Configuración de Alertas y Notificaciones
                    </DialogTitle>
                    <DialogDescription>
                        Define las reglas automáticas para generar alertas en el sistema.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Estado</TableHead>
                                <TableHead>Regla / Condición</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Umbral (Días/Cant)</TableHead>
                                <TableHead>Gravedad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <Switch
                                            checked={rule.enabled}
                                            onCheckedChange={() => toggleRule(rule.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{rule.name}</div>
                                        <div className="text-xs text-muted-foreground">{rule.messageTemplate}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{rule.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {rule.thresholdDays !== undefined && (
                                                <>
                                                    <span className="text-sm text-muted-foreground mr-1">Avisar antes de:</span>
                                                    <Input
                                                        type="number"
                                                        className="w-16 h-8"
                                                        value={rule.thresholdDays}
                                                        onChange={(e) => updateRule(rule.id, { thresholdDays: parseInt(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-sm text-muted-foreground ml-1">días</span>
                                                </>
                                            )}
                                            {rule.thresholdValue !== undefined && (
                                                <>
                                                    <span className="text-sm text-muted-foreground mr-1">Mínimo:</span>
                                                    <Input
                                                        type="number"
                                                        className="w-16 h-8"
                                                        value={rule.thresholdValue}
                                                        onChange={(e) => updateRule(rule.id, { thresholdValue: parseInt(e.target.value) || 0 })}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            rule.severity === 'CRITICAL' ? 'destructive' :
                                                rule.severity === 'HIGH' ? 'destructive' :
                                                    rule.severity === 'MEDIUM' ? 'default' : 'secondary'
                                        } className="uppercase text-[10px]">
                                            {rule.severity}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                    <p>
                        Las alertas se generan automáticamente cada vez que ingresas al sistema basándose en la fecha actual.
                        Los cambios en los umbrales se aplicarán en la próxima verificación.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
