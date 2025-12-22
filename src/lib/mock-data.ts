import { Cliente, InventarioItem, CotizacionItem, RegistroObra, Cotizacion } from "@/types/sistema";

// Helpers para generación de datos aleatorios
const nombres = ["Juan", "María", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Miguel", "Lucía", "Jorge", "Laura", "Andrés", "Valentina", "Ricardo", "Camila", "Fernando", "Isabella", "Gabriel", "Mariana"];
const apellidos = ["Pérez", "García", "Rodríguez", "López", "Martínez", "González", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales", "Ortiz", "Castillo", "Vargas", "Romero", "Castro"];
const empresas = ["Constructora Alfa", "Inversiones Beta", "Soluciones Omega", "Desarrollos Gamma", "Ingeniería Delta", "Tech Solutions", "Edificios Modernos", "Arquitectura Viva", "Obras Civiles SAS", "Proyectos Integrales"];
const materiales = ["Cable UTP", "Cable Eléctrico #12", "Breaker 20A", "Tomacorriente Doble", "Interruptor Sencillo", "Tubería EMT 1/2", "Cinta Aislante", "Tablero de Circuitos", "Bombillo LED 10W", "Canaleta Plástica", "Conector RJ45", "Abrazadera", "Tornillo Goloso", "Chazo Plástico", "Caja 2x4", "Caja 4x4", "Sensor de Movimiento", "Cámara de Seguridad", "Panel Solar", "Inversor"];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generadores
const generateClientes = (count: number): Cliente[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `CLI-${(i + 1).toString().padStart(3, '0')}`,
        nombre: Math.random() > 0.3 ? randomItem(empresas) : `${randomItem(nombres)} ${randomItem(apellidos)}`,
        documento: `${randomInt(800000000, 999999999)}-${randomInt(0, 9)}`,
        direccion: `Cra ${randomInt(1, 100)} # ${randomInt(1, 100)} - ${randomInt(1, 100)}`,
        correo: `contacto${i}@example.com`,
        telefono: `3${randomInt(10, 99)}${randomInt(1000000, 9999999)}`
    }));
};

const generateInventario = (count: number): InventarioItem[] => {
    return Array.from({ length: count }, (_, i) => {
        const precioBase = randomInt(5000, 500000);
        return {
            id: `INV-${(i + 1).toString().padStart(3, '0')}`,
            item: `MAT-${randomInt(100, 999)}`,
            descripcion: `${randomItem(materiales)} - Ref ${randomInt(1, 100)}`,
            unidad: Math.random() > 0.5 ? 'Unidad' : 'Metro',
            cantidad: randomInt(0, 500),
            valorUnitario: precioBase,
            valorTotal: 0,
            tipo: Math.random() > 0.8 ? 'COMPUESTO' : 'SIMPLE',
            costoMateriales: precioBase * 0.7, // Mock cost
            margenUtilidad: 30 // Mock margin
        };
    });
};

const generateCotizaciones = (count: number, clientes: Cliente[], inventario: InventarioItem[]): Cotizacion[] => {
    return Array.from({ length: count }, (_, i) => {
        const clienteObj = randomItem(clientes);
        const numItems = randomInt(1, 5);
        const items = Array.from({ length: numItems }, (_, j) => {
            const itemInv = randomItem(inventario);
            const cantidad = randomInt(1, 10);
            return {
                id: `COT-ITEM-${i}-${j}`,
                inventarioId: itemInv.id,
                descripcion: itemInv.descripcion,
                cantidad: cantidad,
                valorUnitario: itemInv.valorUnitario,
                valorTotal: itemInv.valorUnitario * cantidad
            };
        });

        const subtotal = items.reduce((acc, curr) => acc + curr.valorTotal, 0);

        return {
            id: `COT-${(i + 1).toString().padStart(3, '0')}`,
            numero: `COT-${(i + 1).toString().padStart(3, '0')}`,
            fecha: new Date(2024, randomInt(0, 11), randomInt(1, 28)),
            clienteId: clienteObj.id,
            cliente: clienteObj,
            items: items,
            subtotal: subtotal,
            iva: subtotal * 0.19,
            total: subtotal * 1.19,
            estado: randomItem(['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA'])
        };
    });
};

const generateRegistros = (count: number, clientes: Cliente[]): RegistroObra[] => {
    return Array.from({ length: count }, (_, i) => {
        const total = randomInt(1000000, 50000000);
        const anticipo = total * (randomInt(10, 50) / 100);
        const cotId = `COT-${randomInt(100, 999)}`;
        const clienteObj = randomItem(clientes);

        return {
            id: `REG-${(i + 1).toString().padStart(3, '0')}`,
            cotizacionId: cotId,
            cotizacion: {
                id: cotId,
                numero: cotId, // Mock numero matching ID
                clienteId: clienteObj.id,
                cliente: clienteObj,
                fecha: new Date(),
                items: [],
                subtotal: total,
                iva: 0,
                total: total,
                estado: 'APROBADA' // Must match union type 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA'
            },
            nombreObra: `Proyecto ${randomItem(empresas)} ${randomInt(2024, 2025)}`,
            cliente: clienteObj.nombre,
            fechaInicio: new Date(2024, randomInt(0, 11), randomInt(1, 28)), // Type wants Date, not string
            estado: randomItem(['PENDIENTE', 'EN_PROCESO', 'FINALIZADO']), // Match uppercase enum values if interface differs, checking interface...
            // Interface says: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADO'
            valorTotal: total,
            anticipos: [
                {
                    id: `ANT-${i}`,
                    fecha: new Date(),
                    monto: anticipo,
                    observacion: 'Anticipo Inicial'
                }
            ],
            saldoPendiente: total - anticipo
        };
    });
};

// Generar Datos
export const initialClients = generateClientes(150); // Generamos más para asegurar variedad
export const initialInventory = generateInventario(150);
export const initialQuotes = generateCotizaciones(50, initialClients, initialInventory); // Items sueltos para demo
export const initialRegistros = generateRegistros(50, initialClients);
