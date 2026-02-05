import { Cpu, Network, Wrench, Cable, Bot, LampDesk, User, Package, FileText, ClipboardList, DollarSign, Briefcase } from 'lucide-react';

export const services = [
    {
        icon: LampDesk,
        title: 'Instalaciones Eléctricas',
        description: 'Instalaciones eléctricas residenciales y comerciales de última generación, optimizadas para eficiencia y seguridad.',
    },
    {
        icon: Cable,
        title: 'Cableado Estructurado',
        description: 'Infraestructuras de datos y comunicaciones a prueba de futuro con cableado estructurado de alto rendimiento.',
    },
    {
        icon: Wrench,
        title: 'Mantenimiento Industrial',
        description: 'Mantenimiento proactivo y correctivo para sistemas eléctricos industriales, minimizando el tiempo de inactividad.',
    },
    {
        icon: Network,
        title: 'Diseño de Redes Eléctricas',
        description: 'Diseño e ingeniería inteligente de redes eléctricas robustas y escalables para las demandas modernas.',
    },
    {
        icon: Bot,
        title: 'Automatización y Control',
        description: 'Soluciones de automatización impulsadas por IA para mejorar la productividad y el control sobre sus sistemas eléctricos.',
    },
    {
        icon: Cpu,
        title: 'Integración de Sistemas de IA',
        description: 'Integre sin problemas la inteligencia artificial en su infraestructura eléctrica para un análisis predictivo.',
    },
];

export const projects = [
    {
        id: 'proj1',
        title: 'Centro de Datos Cuántico',
        category: 'Industrial',
        description: 'Distribución de energía de alta densidad para una instalación de computación cuántica de próxima generación.',
        imageId: 'project1',
    },
    {
        id: 'proj2',
        title: 'Red Inteligente Metrópolis',
        category: 'Grids',
        description: 'Red inteligente gestionada por IA que mejora la eficiencia energética en un 30%.',
        imageId: 'project2',
    },
    {
        id: 'proj3',
        title: 'Proyecto Quimera',
        category: 'Automation',
        description: 'Planta de fabricación totalmente automatizada con monitorización eléctrica integrada.',
        imageId: 'project3',
    },
    {
        id: 'proj4',
        title: 'Parque Solar Helios',
        category: 'Renewable',
        description: 'Desarrollo de un parque solar de 500 acres con mantenimiento predictivo.',
        imageId: 'project4',
    },
    {
        id: 'proj5',
        title: 'Torre Synapse',
        category: 'Commercial',
        description: 'Cableado estructurado avanzado para un edificio inteligente de 100 pisos.',
        imageId: 'project5',
    },
    {
        id: 'proj6',
        title: 'Red de Volt-Port',
        category: 'Infrastructure',
        description: 'Red de estaciones de carga de vehículos eléctricos futuristas para toda la ciudad.',
        imageId: 'project6',
    },
];

export const dashboardNavItems = []

export const systemNavItems = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard/sistema',
        icon: FileText, // LayoutDashboardIcon imported elsewhere, using existing for now or fix imports
    },
    {
        id: 'landing',
        label: 'Landing Page',
        href: '/dashboard/sistema/landing',
        icon: Network, // Using Network icon for website management
    },
    {
        id: 'comercial',
        label: 'Comercial',
        href: '/dashboard/sistema/comercial',
        icon: User,
    },
    {
        id: 'financiera',
        label: 'Financiera',
        href: '/dashboard/sistema/financiera',
        icon: DollarSign, // Ensure import
    },
    {
        id: 'logistica',
        label: 'Logística',
        href: '/dashboard/sistema/logistica',
        icon: Package,
    },
    {
        id: 'operaciones',
        label: 'Operaciones',
        href: '/dashboard/sistema/operaciones',
        icon: ClipboardList,
    },
    {
        id: 'talento-humano',
        label: 'Talento Humano',
        href: '/dashboard/sistema/talento-humano',
        icon: User, // Briefcase
    },
    {
        id: 'control',
        label: 'Control y Sistema',
        href: '/dashboard/sistema/control',
        icon: ClipboardList,
    },
]

export const mockQuotes = [
    { id: 'COT-001', date: '2024-07-21', client: 'Constructora Alfa', total: 15000000, status: 'Aprobado' },
    { id: 'COT-002', date: '2024-07-20', client: 'Inversiones Omega', total: 8500000, status: 'Pendiente' },
    { id: 'COT-003', date: '2024-07-18', client: 'Centro Comercial El Sol', total: 25000000, status: 'No aprobado' },
    { id: 'COT-004', date: '2024-07-17', client: 'Edificio Residencial Delta', total: 12300000, status: 'Aprobado' },
];

export const mockClients = [
    { id: 'C001', name: 'Constructora Alfa', document: '900.123.456-7', address: 'Cra 7 # 71-21, Bogotá', email: 'proyectos@alfa.com', phone: '3101234567' },
    { id: 'C002', name: 'Inversiones Omega', document: '900.789.012-3', address: 'Cl 100 # 19-54, Bogotá', email: 'gerencia@omega.com', phone: '3209876543' },
    { id: 'C003', name: 'Centro Comercial El Sol', document: '800.456.789-1', address: 'Av. El Dorado # 85-53, Bogotá', email: 'admin@elsol.com', phone: '3157654321' },
];

export const mockInventory = [
    { id: 'INV-001', description: 'Cable UTP Cat 6A', unit: 'Metro', materialDescription: 'Cobre libre de oxígeno, 4 pares trenzados', quantity: 5000, unitValue: 2500, totalValue: 12500000, plus20: 2500000, totalValue2: 15000000 },
    { id: 'INV-002', description: 'Breaker 20A', unit: 'Unidad', materialDescription: 'Interruptor termomagnético industrial', quantity: 150, unitValue: 45000, totalValue: 6750000, plus20: 1350000, totalValue2: 8100000 },
    { id: 'INV-003', description: 'Canaleta PVC 100x50', unit: 'Tramo 2m', materialDescription: 'Canaleta plástica de alta resistencia', quantity: 300, unitValue: 35000, totalValue: 10500000, plus20: 2100000, totalValue2: 12600000 },
];

export const mockWorkCodes = [
    { id: 'COD-001', name: 'Punto de red certificado', description: 'Instalación y certificación de punto de red categoría 6A.', labor: 80000 },
    { id: 'COD-002', name: 'Salida de iluminación LED', description: 'Instalación de punto de luz, incluye cableado y conexión.', labor: 65000 },
    { id: 'COD-003', name: 'Instalación de tablero de distribución', description: 'Montaje y conexionado de tablero eléctrico principal.', labor: 250000 },
]
