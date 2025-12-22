export default function Loading() {
    return (
        <div className="space-y-6 p-1">
            <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
            <div className="flex gap-4">
                <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md" />
                <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="border rounded-md bg-card p-4 space-y-4">
                <div className="h-8 w-full bg-muted/50 animate-pulse rounded" />
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 w-full bg-muted/30 animate-pulse rounded" />
                    ))}
                </div>
            </div>
        </div>
    );
}
