"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon, DatabaseZap, RefreshCcw } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const DynamicChart = ({
    type,
    data,
    dataKey,
    xAxisKey,
    height = 300,
    color = "#0088FE",
    loading = false,
    error = false,
}: {
    type: string,
    data: any[],
    dataKey: string,
    xAxisKey?: string,
    height?: number,
    color?: string,
    loading?: boolean,
    error?: boolean,
}) => {
    // Nunca mostrar «No data available» cuando el backend aún no ha respondido.
    // Mantener el espacio del gráfico reservado evita saltos bruscos de diseño.
    if ((!data || data.length === 0) && loading) return (
        <div className="relative flex w-full flex-col justify-end overflow-hidden rounded-lg" style={{ height }} aria-label="Sincronizando datos del gráfico" aria-busy="true">
            <div className="absolute inset-0 flex flex-col justify-end gap-4 px-5 pb-7 pt-8">
                <div className="absolute inset-x-5 top-1/4 border-t border-dashed border-border/50" />
                <div className="absolute inset-x-5 top-1/2 border-t border-dashed border-border/50" />
                <div className="absolute inset-x-5 top-3/4 border-t border-dashed border-border/50" />
                <div className="relative flex h-[75%] items-end justify-around gap-4">
                    {[44, 72, 58, 87, 54, 79, 62].map((pct, i) => (
                        <div key={i} className="h-full min-w-0 flex-1 flex items-end">
                            <div className="w-full rounded-t-md bg-gradient-to-t from-primary/20 via-primary/10 to-primary/[.04] animate-pulse"
                                style={{ height: `${pct}%`, animationDelay: `${i * 110}ms` }} />
                        </div>
                    ))}
                </div>
                <div className="relative flex justify-between gap-5">
                    {[0, 1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-1.5 flex-1 rounded-full bg-muted/65 animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
    if (!data || data.length === 0) return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg text-center text-muted-foreground" style={{ height }}>
            {error ? <RefreshCcw className="h-6 w-6 opacity-50" /> : <DatabaseZap className="h-6 w-6 opacity-50" />}
            <span className="max-w-[260px] text-sm">
                {error ? "No pudimos actualizar este gráfico. Vuelve a intentarlo." : "Todavía no hay registros para mostrar."}
            </span>
        </div>
    );

    if (type === 'table') {
        const keys = Object.keys(data[0]).filter(k => k !== 'fill' && k !== 'name' && k !== 'id'); // basic filter
        const displayKeys = xAxisKey ? [xAxisKey, ...keys] : keys;

        return (
            <div className="overflow-auto border rounded-md" style={{ height: `${height}px` }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {displayKeys.map(k => <TableHead key={k} className="capitalize">{k}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, i) => (
                            <TableRow key={i}>
                                {displayKeys.map(k => <TableCell key={k}>{
                                    typeof row[k] === 'number' && (k.includes('total') || k.includes('value') || k.includes('cost') || k.includes('price'))
                                        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(row[k])
                                        : row[k]
                                }</TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            {type === 'area' ? (
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey={xAxisKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color-${dataKey})`} />
                </AreaChart>
            ) : type === 'bar' ? (
                <BarChart data={data}>
                    <XAxis dataKey={xAxisKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            ) : type === 'line' ? (
                <LineChart data={data}>
                    <XAxis dataKey={xAxisKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
            ) : type === 'pie' ? (
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey={dataKey}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Gráfico no soportado</div>
            )}
        </ResponsiveContainer>
    );
};

export const DashboardPanel = ({ title, sub, children, typeState }: any) => {
    const [type, setType] = typeState;
    return (
        <Card className="shadow-sm hover:shadow-md transition-all bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    <CardDescription className="text-xs">{sub}</CardDescription>
                </div>
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    <Button variant={type === 'line' ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={() => setType('line')} title="Lineas"><LineChartIcon className="h-3 w-3" /></Button>
                    <Button variant={type === 'bar' ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={() => setType('bar')} title="Barras"><BarChart3 className="h-3 w-3" /></Button>
                    <Button variant={type === 'area' ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={() => setType('area')} title="Area"><PieChartIcon className="h-3 w-3 rotate-45" /></Button>
                    <Button variant={type === 'pie' ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={() => setType('pie')} title="Pastel"><PieChartIcon className="h-3 w-3" /></Button>
                    <Button variant={type === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={() => setType('table')} title="Tabla"><TableIcon className="h-3 w-3" /></Button>
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}
