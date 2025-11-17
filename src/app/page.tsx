import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { services, projects } from '@/lib/data';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedBackground } from '@/components/animated-background';
import { MoveRight, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { deleteProjectAction, uploadProjectAction } from './actions';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <AnimatedBackground />
        <div className="z-10 flex flex-col items-center p-4">
          <h1 className="text-5xl md:text-7xl font-bold text-glow-primary tracking-tighter mb-4 font-headline">
            Electric Intelligence Engineering
          </h1>
          <p className="text-lg md:text-xl text-primary/80 max-w-3xl mx-auto mb-8">
            Pioneering the future of energy with AI-driven electrical solutions, from intelligent grids to advanced structured cabling.
          </p>
          <Button size="lg" className="electric-button font-bold text-lg px-8 py-6">
            Explore Our Services <MoveRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-4 font-headline">Fusing Electricity with Intelligence</h2>
              <p className="text-lg text-foreground/80 mb-4">
                At VoltAI, we are more than just electrical engineers. We are innovators and architects of the future, dedicated to integrating cutting-edge artificial intelligence with foundational electrical systems. Our expertise spans complex electrical installations, robust structured cabling, and the design of resilient power grids.
              </p>
              <p className="text-lg text-foreground/80">
                We believe in creating sustainable, efficient, and intelligent infrastructures that power tomorrow's world. Our team's deep knowledge in applied engineering ensures every project is a benchmark in quality and forward-thinking design.
              </p>
            </div>
            <div className="relative h-80 w-full">
              <Image
                src={getPlaceholderImage('about-us-image')?.imageUrl || ''}
                alt="Futuristic electrical grid"
                fill
                className="object-cover rounded-lg shadow-2xl shadow-primary/20"
                data-ai-hint="electrical grid"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary mb-2 font-headline">Our Expertise</h2>
          <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
            We provide a comprehensive suite of services to power your vision, from initial design to long-term maintenance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 text-left transform transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-2xl hover:shadow-primary/20">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-primary-foreground font-headline">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-foreground/70">{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-2 font-headline">Project Showcase</h2>
              <p className="text-lg text-foreground/80 max-w-2xl">
                A glimpse into our portfolio of successfully executed next-generation projects.
              </p>
            </div>
            <form action={uploadProjectAction}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" className="bg-accent/80 hover:bg-accent text-accent-foreground font-bold">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Project
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Admin only: Upload a new project.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </form>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="group relative overflow-hidden rounded-lg border-border/50 bg-card/50">
                <Image
                  src={getPlaceholderImage(project.imageId)?.imageUrl || ''}
                  alt={project.title}
                  width={600}
                  height={400}
                  className="object-cover w-full h-60 transform transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint={getPlaceholderImage(project.imageId)?.imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-xl font-bold text-primary-foreground mb-1 font-headline">{project.title}</h3>
                  <p className="text-sm text-foreground/80">{project.description}</p>
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                     <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="submit" size="icon" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Admin only: Delete project.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-4 font-headline">Connect With Us</h2>
              <p className="text-lg text-foreground/80 mb-8">
                Have a project in mind or need expert consultation? Reach out and let's build the future together.
              </p>
              <form className="space-y-6">
                <Input
                  type="text"
                  placeholder="Your Name"
                  className="bg-background/50 text-lg p-6 focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  className="bg-background/50 text-lg p-6 focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
                />
                <Textarea
                  placeholder="Your Message"
                  className="bg-background/50 text-lg p-6 min-h-[150px] focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
                />
                <Button type="submit" size="lg" className="w-full electric-button font-bold text-lg p-6 bg-primary text-primary-foreground hover:text-primary-foreground">
                  Send Message
                </Button>
              </form>
            </div>
            <div className="relative h-96 md:h-full w-full mt-8 md:mt-0">
               <Image
                src={getPlaceholderImage('contact-map')?.imageUrl || ''}
                alt="Stylized map"
                fill
                className="object-cover rounded-lg"
                style={{
                  filter: 'grayscale(1) invert(1) sepia(1) saturate(5) hue-rotate(140deg) brightness(0.7) contrast(1.5)',
                }}
                data-ai-hint="map location"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
