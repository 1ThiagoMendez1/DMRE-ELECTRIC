import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="mx-auto max-w-sm w-full border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 text-2xl font-bold font-headline text-glow-primary mb-2">
            <Image src="/logo.png" alt="D.M.R.E Logo" width={56} height={56} className="h-14 w-14" />
            <span>D.M.R.E</span>
          </Link>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa a tu panel de administración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@ejemplo.com"
                required
                className="bg-background/50 text-base p-5 focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input id="password" type="password" required 
                className="bg-background/50 text-base p-5 focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
              />
            </div>
            <Button type="submit" asChild className="w-full electric-button font-bold text-lg p-6 bg-primary text-primary-foreground hover:text-primary-foreground">
              <Link href="/dashboard">Ingresar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
