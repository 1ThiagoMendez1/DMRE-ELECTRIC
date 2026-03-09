import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getProjects } from '@/actions/landing-actions';
import Image from 'next/image';

export default async function PortfolioPage() {
    const projectsData = await getProjects();
    const projects = projectsData || [];

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-32">
                <section className="py-20 bg-background border-b border-border">
                    <div className="container mx-auto px-4">
                        <h1 className="text-5xl lg:text-7xl font-black font-headline mb-8 text-foreground">Nuestro <span className="text-primary italic">Legado</span></h1>
                        <p className="text-2xl max-w-3xl text-muted-foreground leading-relaxed">
                            Una vitrina de excelencia técnica y compromiso en cada proyecto que emprendemos.
                        </p>
                    </div>
                </section>

                <section className="py-24 bg-secondary/10">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {projects.map((project: any, index: number) => (
                                <div key={index} className="group relative rounded-3xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-premium transition-all duration-500">
                                    <div className="aspect-[4/3] relative overflow-hidden">
                                        <Image
                                            src={project.image_url || 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=600'}
                                            alt={project.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                                            <p className="text-white text-lg font-medium leading-relaxed">{project.description}</p>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <span className="text-sm font-bold uppercase tracking-widest text-primary mb-2 block">{project.category}</span>
                                        <h3 className="text-2xl font-bold font-headline text-foreground">{project.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
