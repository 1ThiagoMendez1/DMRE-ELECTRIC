"use client";

import { WorkCodesTable } from "@/components/erp/work-codes-table";
import { InstalacionesTable } from "@/components/erp/instalaciones-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Bolt } from "lucide-react";

export default function CodigosTrabajoPage() {
    return (
        <div className="flex flex-col space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Base de Tareas y Códigos</h1>
                <p className="text-muted-foreground">Define estándar de APUs o Instalaciones para cotizaciones.</p>
            </div>

            <Tabs defaultValue="apus" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-4">
                    <TabsTrigger value="apus" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Package className="w-4 h-4 mr-2" />
                        Códigos APUs
                    </TabsTrigger>
                    <TabsTrigger value="instalaciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Bolt className="w-4 h-4 mr-2" />
                        Instalaciones
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="apus" className="mt-0">
                    <WorkCodesTable />
                </TabsContent>

                <TabsContent value="instalaciones" className="mt-0">
                    <InstalacionesTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
