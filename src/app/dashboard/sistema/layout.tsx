import { ErpProvider } from "@/components/providers/erp-provider";

export default function SistemaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErpProvider>
            {children}
        </ErpProvider>
    );
}
