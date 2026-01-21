import {
    Cliente,
    InventarioItem,
    Cotizacion,
    CotizacionItem,
    RegistroObra,
    Material,
    Factura,
    CuentaBancaria,
    MovimientoFinanciero,
    ObligacionFinanciera,
    Proveedor,
    CuentaPorPagar,
    Vehiculo,
    GastoVehiculo,
    Empleado,
    LiquidacionNomina,
    TipoOferta,
    TipoMovimiento,
    CategoriaMovimiento,
    MovimientoInventario,
    TipoMovimientoInventario,
    NovedadNomina,
    TipoNovedad,
    TipoGastoVehiculo,
    User,
    UserRole,
    DotacionItem,
    EntregaDotacion,
    CreditoEmpleado,
    TareaAgenda,
    Role,
    Permission,
    CodigoTrabajo,
    MaterialAsociado,
    OrdenCompra,
    DetalleCompra,
    EstadoOrdenCompra
} from "@/types/sistema";
import { addDays, subDays } from "date-fns";

export const initialUsers: User[] = [
    {
        id: "USR-001",
        name: "Admin Sistema",
        email: "admin@dmre.com",
        role: "ADMIN",
        avatar: "https://github.com/shadcn.png",
        sidebarAccess: ['dashboard', 'comercial', 'financiera', 'logistica', 'operaciones', 'talento-humano', 'control']
    },
    {
        id: "USR-002",
        name: "Ingeniero Jefe",
        email: "ingenieria@dmre.com",
        role: "ENGINEER",
        avatar: "",
        sidebarAccess: ['dashboard', 'operaciones', 'logistica']
    },
    {
        id: "USR-003",
        name: "Cliente Demo",
        email: "cliente@empresa.com",
        role: "CLIENT",
        avatar: "",
        sidebarAccess: ['dashboard']
    }
];

// Generador Determinista de Números Aleatorios
let seed = 123456;
const seededRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

const randomInt = (min: number, max: number) => {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
};

const randomItem = <T>(arr: T[]): T => {
    return arr[Math.floor(seededRandom() * arr.length)];
};

const randomDate = (startYear: number, endYear: number) => {
    // Override: Always return Dec 2025 or Jan 2026 to satisfy "todos los datos con fecha para diciembre 2025 y enero 2026"
    // Actually, let's make it cleaner:
    const start = new Date(2025, 11, 1).getTime(); // Dec 1, 2025
    const end = new Date(2026, 0, 31).getTime(); // Jan 31, 2026
    return new Date(start + seededRandom() * (end - start));
};

const randomRecentDate = () => {
    const start = new Date(2025, 11, 1).getTime();
    const end = new Date(2026, 0, 31).getTime();
    return new Date(start + seededRandom() * (end - start));
};

// --- DATA LISTS ---
const empresas = ["TechSol", "InnoVate", "BuildCorp", "EnergyFix", "GreenPower", "UrbanConstruct", "DataFlow", "NetSys", "AlphaOmega", "Constructora Bolívar", "Amarilo", "Cusezar", "Marval"];
const nombres = ["Juan", "Maria", "Carlos", "Ana", "Pedro", "Luisa", "Jorge", "Sofia", "Andres", "Camila"];
const apellidos = ["Perez", "Gomez", "Rodriguez", "Lopez", "Martinez", "Garcia", "Hernandez", "Torres", "Ramirez", "Vargas"];
const itemsInventarioNames = ["Cable #12 THHN", "Breaker 20A", "Tubo Conduit 1/2", "Caja 4x4", "Tomacorriente GFCI", "Interruptor Sencillo", "Cinta Aislante", "Terminal Ojo", "Gabinete 30x30", "Contactor Tripolar"];
const materialesNames = ["Cobre", "Plastico", "Acero", "Aluminio", "Caucho", "Silicio", "Vidrio", "Ceramica"];
const ubicaciones = ["BODEGA", "OBRA"];
const categoriasArticulo = ["MATERIAL", "HERRAMIENTA", "DOTACION", "EPP"];
const categoriasProveedor = ["MATERIALES", "SERVICIOS", "MIXTO"];

// --- GENERATORS ---

const generateClientes = (count: number): Cliente[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `CLI-${(i + 1).toString().padStart(3, '0')}`,
        nombre: `${randomItem(empresas)} S.A.S`,
        documento: `${randomInt(800000000, 999999999)}-${randomInt(0, 9)}`,
        direccion: `Calle ${randomInt(1, 100)} #${randomInt(1, 100)}-${randomInt(1, 100)}`,
        correo: `contacto@${randomItem(empresas).toLowerCase()}.com`,
        telefono: `3${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
        contactoPrincipal: `${randomItem(nombres)} ${randomItem(apellidos)}`,
        fechaCreacion: randomDate(2023, 2024),
    }));
};

const generateInventario = (count: number, proveedores: Proveedor[]): InventarioItem[] => {
    return Array.from({ length: count }, (_, i) => {
        const precioBase = randomInt(5000, 500000);
        const isCompuesto = seededRandom() > 0.8;
        const proveedor = randomItem(proveedores);

        return {
            id: `INV-${(i + 1).toString().padStart(3, '0')}`,
            item: `ITEM-${(i + 1).toString().padStart(3, '0')}`,
            sku: `SKU-${randomInt(1000, 9999)}`,
            descripcion: randomItem(itemsInventarioNames) + ` ` + ["Premium", "Standard", "Eco"][randomInt(0, 2)],
            categoria: randomItem(categoriasArticulo) as any,
            ubicacion: randomItem(ubicaciones) as any,
            unidad: ["UND", "MTR", "CAJA"][randomInt(0, 2)],
            cantidad: randomInt(0, 1000),
            stockMinimo: randomInt(10, 50),
            fechaCreacion: randomDate(2023, 2024),
            tipo: isCompuesto ? 'COMPUESTO' : 'SIMPLE',
            proveedorId: proveedor.id,
            materiales: isCompuesto ? Array.from({ length: randomInt(2, 4) }, (_, j) => ({
                id: `MAT-${i}-${j}`,
                inventarioId: `INV-MOCK-${j}`,
                descripcion: randomItem(materialesNames),
                unidad: 'KG',
                cantidad: randomInt(1, 5),
                valorUnitario: precioBase * 0.1,
                valorTotal: (precioBase * 0.1) * randomInt(1, 5)
            })) : [],
            costoMateriales: precioBase * 0.7,
            margenUtilidad: 0.3,
            valorTotal: precioBase,
            valorUnitario: precioBase,
            t1: precioBase * 1.1,
            t2: precioBase * 1.2,
            t3: precioBase * 1.3
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
                valorTotal: itemInv.valorUnitario * cantidad,
                tipo: 'PRODUCTO' as const // Fixed type error
            };
        });

        const subtotal = items.reduce((acc, curr) => acc + curr.valorTotal, 0);
        const aiuAdmin = subtotal * 0.10;
        const aiuImprevistos = subtotal * 0.05;
        const aiuUtilidad = subtotal * 0.05;
        const baseIva = subtotal + aiuUtilidad; // IVA usually on Utility for AIU contracts, or full. Simplified: Full 19% on subtotal+AIU for now.
        const iva = (subtotal + aiuAdmin + aiuImprevistos + aiuUtilidad) * 0.19;
        const total = subtotal + aiuAdmin + aiuImprevistos + aiuUtilidad + iva;

        return {
            id: `COT-${(i + 1).toString().padStart(3, '0')}`,
            numero: `CP-${randomInt(1000, 9999)}`,
            tipo: randomItem(['NORMAL', 'SIMPLIFICADA']) as TipoOferta,
            fecha: randomDate(2024, 2025),
            clienteId: clienteObj.id,
            cliente: clienteObj,
            descripcionTrabajo: `Instalación y mantenimiento de ${items[0].descripcion}`,
            items: items,
            subtotal: subtotal,
            aiuAdmin,
            aiuImprevistos,
            aiuUtilidad,
            iva,
            total,
            estado: randomItem(['PENDIENTE', 'APROBADA', 'NO_APROBADA', 'EN_EJECUCION', 'FINALIZADA'])
        };
    });
};

const generateFacturas = (cotizaciones: Cotizacion[]): Factura[] => {
    return cotizaciones
        .filter(c => c.estado === 'FINALIZADA' || c.estado === 'EN_EJECUCION' || c.estado === 'APROBADA')
        .map((c, i) => {
            const valorFacturado = c.total;
            const anticipo = valorFacturado * 0.3;
            const rRenta = valorFacturado * 0.025;
            const rIca = valorFacturado * 0.00966;
            const rIva = 0;
            const saldo = valorFacturado - anticipo - rRenta - rIca;

            return {
                id: `FAC-${(i + 1).toString().padStart(4, '0')}`,
                cotizacionId: c.id,
                cotizacion: c,
                fechaEmision: new Date(2025, 11, randomInt(1, 31)), // Dec 2025
                fechaVencimiento: new Date(2026, 0, randomInt(10, 31)), // Jan 2026 Only
                valorFacturado,
                anticipoRecibido: anticipo,
                retencionRenta: rRenta,
                retencionIca: rIca,
                retencionIva: rIva,
                saldoPendiente: saldo,
                estado: randomItem(['PENDIENTE', 'PARCIAL', 'CANCELADA'])
            };
        });
};

const generateRegistros = (count: number, clientes: Cliente[]): RegistroObra[] => {
    // Legacy support, mirroring or linking to Approved Quotes
    return Array.from({ length: count }, (_, i) => {
        const total = randomInt(5000000, 50000000);
        const clienteObj = randomItem(clientes);
        return {
            id: `REG-${(i + 1)}`,
            cotizacionId: `legacy-${i}`,
            cotizacion: {
                id: `legacy-${i}`,
                numero: `LEG-${i}`,
                tipo: 'NORMAL',
                fecha: new Date(),
                clienteId: clienteObj.id,
                cliente: clienteObj,
                descripcionTrabajo: "Legacy Work",
                items: [],
                subtotal: total,
                aiuAdmin: 0, aiuImprevistos: 0, aiuUtilidad: 0, iva: 0,
                total: total,
                estado: 'APROBADA'
            },
            fechaInicio: new Date(),
            estado: 'EN_PROCESO',
            anticipos: [],
            saldoPendiente: total,
            nombreObra: `Proyecto Legacy ${i}`,
            cliente: clienteObj.nombre,
            valorTotal: total
        }
    });
};

const generateProveedores = (count: number): Proveedor[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `PROV-${i + 1}`,
        nombre: `Distribuidora ${randomItem(apellidos)}`,
        nit: `${randomInt(800000000, 900000000)}`,
        categoria: randomItem(categoriasProveedor) as any,
        datosBancarios: `Bancolombia Ahorros ${randomInt(100000, 999999)}`,
        correo: `ventas@prov-${i}.com`
    }));
};

const generateEmpleados = (count: number): Empleado[] => {
    const cargos = ["Electricista", "Ayudante", "Ingeniero Residente", "Administrador", "Conductor"];
    return Array.from({ length: count }, (_, i) => ({
        id: `EMP-${i + 1}`,
        nombreCompleto: `${randomItem(nombres)} ${randomItem(apellidos)}`,
        cedula: `${randomInt(10000000, 99999999)}`,
        cargo: randomItem(cargos),
        salarioBase: randomInt(1300000, 5000000),
        fechaIngreso: randomDate(2020, 2024),
        estado: 'ACTIVO'
    }));
};

const generateVehiculos = (count: number): Vehiculo[] => {
    const colores = ['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul'];
    const estados: Array<'OPERATIVO' | 'MANTENIMIENTO' | 'INACTIVO'> = ['OPERATIVO', 'OPERATIVO', 'OPERATIVO', 'OPERATIVO', 'MANTENIMIENTO', 'INACTIVO'];

    return Array.from({ length: count }, (_, i) => ({
        id: `VEH-${i + 1}`,
        placa: `${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}-${randomInt(100, 999)}`,
        marcaModelo: randomItem(["Chevrolet N300", "Renault Kangoo", "Toyota Hilux", "Jac 1040", "Ford Ranger", "Nissan NP300"]),
        conductorAsignado: `${randomItem(nombres)} ${randomItem(apellidos)}`,
        vencimientoSoat: addDays(new Date(), randomInt(-30, 300)),
        vencimientoTecnomecanica: addDays(new Date(), randomInt(-30, 300)),
        vencimientoSeguro: addDays(new Date(), randomInt(-30, 300)),
        estado: randomItem(estados),
        kilometrajeActual: randomInt(15000, 180000),
        ano: randomInt(2018, 2024),
        color: randomItem(colores),
        fechaRegistro: randomDate(2020, 2023)
    }));
};

const generateCuentasBancarias = (): CuentaBancaria[] => [
    { id: 'CB-1', nombre: 'Bancolombia Principal', tipo: 'BANCO', saldoActual: randomInt(50000000, 200000000), numeroCuenta: '234-567890-12' },
    { id: 'CB-2', nombre: 'Davivienda Nómina', tipo: 'BANCO', saldoActual: randomInt(10000000, 50000000), numeroCuenta: '987-654321-00' },
    { id: 'CB-3', nombre: 'Caja Menor Oficina', tipo: 'EFECTIVO', saldoActual: randomInt(500000, 2000000) }
];

const generateMovimientos = (count: number, cuentas: CuentaBancaria[]): MovimientoFinanciero[] => {
    return Array.from({ length: count }, (_, i) => {
        const tipo = randomItem(['INGRESO', 'EGRESO']) as TipoMovimiento;
        return {
            id: `MOV-${(i + 1).toString().padStart(4, '0')}`,
            fecha: randomDate(2024, 2025),
            tipo: tipo,
            cuentaId: randomItem(cuentas).id,
            cuenta: randomItem(cuentas),
            categoria: randomItem(['NOMINA', 'PROVEEDORES', 'SERVICIOS', 'IMPUESTOS', 'VENTAS', 'OTROS']) as CategoriaMovimiento,
            tercero: tipo === 'INGRESO' ? `Cliente ${randomInt(1, 100)}` : `Proveedor ${randomInt(1, 50)}`,
            concepto: tipo === 'INGRESO' ? 'Pago Factura de Venta' : 'Pago de Servicios Publicos',
            valor: randomInt(100000, 5000000)
        };
    }).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
};

const generateObligaciones = (count: number): ObligacionFinanciera[] => {
    return Array.from({ length: count }, (_, i) => {
        const monto = randomInt(50000000, 300000000);
        return {
            id: `OBL-${i + 1}`,
            entidad: randomItem(['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'Financiera Juriscoop']),
            montoPrestado: monto,
            tasaInteres: randomInt(10, 25) / 100, // 10% - 25% E.A.
            plazoMeses: randomItem([12, 24, 36, 48, 60]),
            saldoCapital: monto * (randomInt(20, 90) / 100),
            valorCuota: monto / 36, // Approx
            fechaInicio: randomDate(2022, 2023)
        };
    });
};

const generateMovimientosInventario = (count: number, articulos: InventarioItem[]): MovimientoInventario[] => {
    return Array.from({ length: count }, (_, i) => {
        const item = randomItem(articulos);
        const tipo = randomItem(['ENTRADA', 'SALIDA']) as TipoMovimientoInventario;
        return {
            id: `MOV-INV-${i + 1}`,
            fecha: randomDate(2024, 2025),
            tipo: tipo,
            articuloId: item.id,
            articulo: item,
            cantidad: randomInt(1, 50),
            responsableId: `EMP-${randomInt(1, 10)}`
        };
    }).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
};

const generateCuentasPorPagar = (count: number, proveedores: Proveedor[]): CuentaPorPagar[] => {
    return Array.from({ length: count }, (_, i) => {
        const total = randomInt(500000, 10000000);
        const valorPagado = total * (randomInt(0, 80) / 100);
        const pagos: any[] = [];

        if (valorPagado > 0) {
            const numPagos = randomInt(1, 3);
            let remaining = valorPagado;
            for (let j = 0; j < numPagos; j++) {
                const val = j === numPagos - 1 ? remaining : remaining / numPagos;
                pagos.push({
                    id: `PAY-${i}-${j}`,
                    fecha: subDays(new Date(), randomInt(1, 60)),
                    valor: val,
                    nota: "Abono parcial"
                });
                remaining -= val;
            }
        }

        return {
            id: `R-CXP-${i + 1}`,
            proveedorId: randomItem(proveedores).id,
            proveedor: randomItem(proveedores),
            numeroFacturaProveedor: `REF-${randomInt(1000, 9999)}`,
            fecha: randomDate(2024, 2025),
            concepto: 'Compra de Materiales',
            valorTotal: total,
            valorPagado: valorPagado,
            saldoPendiente: total - valorPagado,
            pagos: pagos
        };
    });
};

const generateGastosVehiculos = (count: number, vehiculos: Vehiculo[]): GastoVehiculo[] => {
    return Array.from({ length: count }, (_, i) => {
        const tipo = randomItem(['COMBUSTIBLE', 'PEAJE', 'MANTENIMIENTO', 'PARQUEADERO', 'OTROS']) as TipoGastoVehiculo;
        return {
            id: `GST-VEH-${i + 1}`,
            fecha: randomDate(2024, 2025),
            vehiculoId: randomItem(vehiculos).id,
            vehiculo: randomItem(vehiculos),
            tipo: tipo,
            kilometraje: randomInt(10000, 150000),
            valor: randomInt(20000, 500000),
            proveedor: `Serviteca ${randomInt(1, 20)}`
        };
    }).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
};

const generateNovedadesNomina = (count: number, empleados: Empleado[]): NovedadNomina[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `NOV-${i + 1}`,
        empleadoId: randomItem(empleados).id,
        fecha: randomDate(2024, 2025),
        tipo: randomItem(['HORA_EXTRA_DIURNA', 'HORA_EXTRA_NOCTURNA', 'FESTIVA', 'AUSENCIA']) as TipoNovedad,
        cantidad: randomInt(1, 8),
        valorUnitario: randomInt(5000, 20000),
        valorCalculado: randomInt(20000, 100000),
        efecto: 'SUMA'
    }));
};

const generateLiquidaciones = (count: number, empleados: Empleado[]): LiquidacionNomina[] => {
    return Array.from({ length: count }, (_, i) => {
        const emp = randomItem(empleados);
        const devengado = emp.salarioBase + randomInt(0, 200000);
        const deducido = devengado * 0.08;
        return {
            id: `LIQ-${i + 1}`,
            periodo: `2024-${randomInt(1, 12).toString().padStart(2, '0')}-Q${randomInt(1, 2)}`,
            empleadoId: emp.id,
            empleado: emp,
            totalDevengado: devengado,
            totalDeducido: deducido,
            netoPagar: devengado - deducido,
            estado: 'PENDIENTE',
            detalle: '{}'
        };
    });
};


// --- NEW GENERATORS ---

const generateDotacionItems = (): DotacionItem[] => [
    {
        id: 'DOT-1',
        descripcion: 'Camisa Polo Institucional',
        categoria: 'UNIFORME',
        genero: 'UNISEX',
        stockMinimo: 20,
        variantes: [
            { id: 'v1', talla: 'S', color: 'Azul', cantidadDisponible: 15 },
            { id: 'v2', talla: 'M', color: 'Azul', cantidadDisponible: 50 },
            { id: 'v3', talla: 'L', color: 'Azul', cantidadDisponible: 40 },
        ]
    },
    {
        id: 'DOT-2',
        descripcion: 'Botas de Seguridad Dielectricas',
        categoria: 'EPP',
        genero: 'UNISEX',
        stockMinimo: 15,
        fechaVencimiento: addDays(new Date(), 25), // Vence en 25 días
        variantes: [
            { id: 'v4', talla: '38', color: 'Negro', cantidadDisponible: 10 },
            { id: 'v5', talla: '40', color: 'Negro', cantidadDisponible: 20 },
            { id: 'v6', talla: '42', color: 'Negro', cantidadDisponible: 15 },
        ]
    },
    {
        id: 'DOT-3',
        descripcion: 'Casco de Seguridad',
        categoria: 'EPP',
        genero: 'UNISEX',
        stockMinimo: 10,
        fechaVencimiento: addDays(new Date(), 180), // Vence en 6 meses
        variantes: [
            { id: 'v7', talla: 'Unica', color: 'Blanco', cantidadDisponible: 30 },
            { id: 'v8', talla: 'Unica', color: 'Amarillo', cantidadDisponible: 10 },
        ]
    },
    {
        id: 'DOT-4',
        descripcion: 'Guantes de Carnaza',
        categoria: 'EPP',
        genero: 'UNISEX',
        stockMinimo: 50,
        fechaVencimiento: addDays(new Date(), 15), // Vence en 15 días - ALERTA
        variantes: [
            { id: 'v9', talla: 'Unica', color: 'Gris', cantidadDisponible: 100 },
        ]
    },
    {
        id: 'DOT-5',
        descripcion: 'Pantalón Jean Institucional',
        categoria: 'UNIFORME',
        genero: 'UNISEX',
        stockMinimo: 25,
        variantes: [
            { id: 'v10', talla: '30', color: 'Azul Oscuro', cantidadDisponible: 8 },
            { id: 'v11', talla: '32', color: 'Azul Oscuro', cantidadDisponible: 12 },
            { id: 'v12', talla: '34', color: 'Azul Oscuro', cantidadDisponible: 18 },
        ]
    },
    {
        id: 'DOT-6',
        descripcion: 'Gafas de Seguridad',
        categoria: 'EPP',
        genero: 'UNISEX',
        stockMinimo: 30,
        variantes: [
            { id: 'v13', talla: 'Unica', color: 'Transparente', cantidadDisponible: 45 },
        ]
    },
];

const generateEntregasDotacion = (count: number, empleados: Empleado[], items: DotacionItem[]): EntregaDotacion[] => {
    const estados: Array<'ASIGNADO' | 'ACEPTADO' | 'ENTREGADO' | 'RECHAZADO'> = ['ASIGNADO', 'ACEPTADO', 'ENTREGADO', 'ENTREGADO', 'ENTREGADO'];

    return Array.from({ length: count }, (_, i) => {
        const item = randomItem(items);
        const variant = randomItem(item.variantes);
        const estado = randomItem(estados);
        const fechaAsignacion = randomDate(2024, 2025);

        // Generate traceability data based on estado
        const fechaAceptacion = (estado === 'ACEPTADO' || estado === 'ENTREGADO')
            ? addDays(fechaAsignacion, randomInt(1, 5))
            : undefined;
        const fechaEntrega = estado === 'ENTREGADO'
            ? addDays(fechaAceptacion || fechaAsignacion, randomInt(1, 3))
            : undefined;

        return {
            id: `ENT-DOT-${i + 1}`,
            fecha: fechaAsignacion,
            empleadoId: randomItem(empleados).id,
            empleado: randomItem(empleados),
            items: [{
                dotacionId: item.id,
                varianteId: variant.id,
                descripcion: item.descripcion,
                detalle: `${variant.talla} - ${variant.color}`,
                cantidad: randomInt(1, 2)
            }],
            estado: estado,
            usuarioAsigna: 'Admin Sistema',
            fechaAceptacion: fechaAceptacion,
            usuarioConfirma: estado === 'ENTREGADO' ? 'Admin Sistema' : undefined,
            fechaEntrega: fechaEntrega,
            observacion: "Entrega trimestral"
        };
    });
};

const generateCreditosEmpleados = (count: number, empleados: Empleado[]): CreditoEmpleado[] => {
    return Array.from({ length: count }, (_, i) => {
        const monto = randomInt(500000, 2000000);
        const plazo = randomInt(3, 12);
        return {
            id: `CRE-EMP-${i + 1}`,
            empleadoId: randomItem(empleados).id,
            empleado: randomItem(empleados),
            montoPrestado: monto,
            plazoMeses: plazo,
            cuotaMensual: monto / plazo,
            saldoPendiente: monto * (randomInt(10, 90) / 100),
            fechaOtorgado: randomDate(2023, 2024),
            estado: randomItem(['ACTIVO', 'PAGADO']) as any
        };
    });
};

const generateAgenda = (count: number): TareaAgenda[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `TSK-${i + 1}`,
        titulo: `Tarea ${randomInt(1, 100)}: ${randomItem(['Revisión de Obra', 'Compra Materiales', 'Reunión Cliente', 'Mantenimiento Vehículo'])}`,
        descripcion: "Detalles de la tarea pendientes de confirmar con el encargado.",
        fechaVencimiento: addDays(new Date(), randomInt(-5, 15)),
        prioridad: randomItem(['ALTA', 'MEDIA', 'BAJA']) as any,
        estado: randomItem(['PENDIENTE', 'EN_PROCESO', 'COMPLETADA']) as any
    }));
};

// --- EXPORTS ---

export const initialClients = generateClientes(50);
// Generate proveedores FIRST so inventario can reference them
export const initialProveedores = generateProveedores(20);
export const initialInventory = generateInventario(100, initialProveedores);
export const initialQuotes = generateCotizaciones(40, initialClients, initialInventory);
export const initialRegistros = initialQuotes.filter(q => q.estado === 'EN_EJECUCION' || q.estado === 'FINALIZADA').map(q => ({
    id: `REG-${q.id}`,
    cotizacionId: q.id,
    cotizacion: q,
    fechaInicio: q.fecha,
    estado: q.estado === 'FINALIZADA' ? 'FINALIZADO' : 'EN_PROCESO',
    anticipos: [],
    saldoPendiente: q.total,
    nombreObra: q.descripcionTrabajo.substring(0, 30) + "...",
    cliente: q.cliente.nombre,
    valorTotal: q.total
} as RegistroObra));

export const initialFacturas = generateFacturas(initialQuotes);
export const initialCuentas = generateCuentasBancarias();
export const initialMovimientos = generateMovimientos(100, initialCuentas);
export const initialObligaciones = generateObligaciones(5);
export const initialMovimientosInventario = generateMovimientosInventario(100, initialInventory);
export const initialCuentasPorPagar = generateCuentasPorPagar(30, initialProveedores);
export const initialEmpleados = generateEmpleados(15);
export const initialVehiculos = generateVehiculos(5);
export const initialGastosVehiculos = generateGastosVehiculos(50, initialVehiculos);
export const initialNovedades = generateNovedadesNomina(30, initialEmpleados);
export const initialLiquidaciones = generateLiquidaciones(40, initialEmpleados);

// New Data
export const initialDotacionItems = generateDotacionItems();
export const initialEntregasDotacion = generateEntregasDotacion(20, initialEmpleados, initialDotacionItems);
export const initialCreditosEmpleados = generateCreditosEmpleados(10, initialEmpleados);
export const initialAgenda = generateAgenda(25);

// Roles Data
export const initialRoles: Role[] = [
    {
        id: "ROLE-ADMIN",
        nombre: "Administrador",
        descripcion: "Acceso total al sistema",
        permisos: [],
        color: "bg-red-500",
        isSystemRole: true
    },
    {
        id: "ROLE-ENGINEER",
        nombre: "Ingeniero",
        descripcion: "Gestión de operaciones y proyectos",
        permisos: [],
        color: "bg-blue-500",
        isSystemRole: true
    },
    {
        id: "ROLE-VIEWER",
        nombre: "Visualizador",
        descripcion: "Solo lectura en todos los módulos",
        permisos: [],
        color: "bg-gray-500",
        isSystemRole: true
    }
];

const generateOrdenesCompra = (count: number, proveedores: Proveedor[], inventario: InventarioItem[]): OrdenCompra[] => {
    return Array.from({ length: count }, (_, i) => {
        const proveedor = randomItem(proveedores);

        // Filter inventory items that belong to this supplier
        const proveedorItems = inventario.filter(inv => inv.proveedorId === proveedor.id);
        // Fallback to all items if proveedor has no items (shouldn't happen in seeded data)
        const itemPool = proveedorItems.length > 0 ? proveedorItems : inventario;

        // Generate Items
        const numItems = randomInt(1, Math.min(4, itemPool.length));
        const items: DetalleCompra[] = Array.from({ length: numItems }, (_, j) => {
            const itemInv = itemPool[j % itemPool.length]; // Cycle through available items
            // Simulate Price Variation (History)
            const variation = (randomInt(0, 30) - 15) / 100;
            const histPrice = itemInv.valorUnitario * (1 + variation);
            const qty = randomInt(10, 100);

            return {
                id: `OC-DET-${i}-${j}`,
                inventarioId: itemInv.id,
                descripcion: itemInv.descripcion,
                cantidad: qty,
                valorUnitario: histPrice,
                subtotal: histPrice * qty,
                recibido: qty
            };
        });

        // Recalculate true totals based on items
        const trueSubtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
        const trueImpuestos = trueSubtotal * 0.19;

        return {
            id: `OC-${i + 1}`,
            numero: `OC-${(i + 1).toString().padStart(4, '0')}`,
            proveedorId: proveedor.id,
            proveedor: proveedor,
            fechaEmision: randomDate(2024, 2025),
            fechaEntregaEstimada: randomDate(2024, 2025),
            items: items,
            subtotal: trueSubtotal,
            impuestos: trueImpuestos,
            total: trueSubtotal + trueImpuestos,
            estado: randomItem(['RECIBIDA', 'RECIBIDA', 'RECIBIDA', 'PARCIAL', 'PENDIENTE']) as EstadoOrdenCompra,
            observaciones: "Pedido de reposición de inventario"
        };
    }).sort((a, b) => b.fechaEmision.getTime() - a.fechaEmision.getTime());
};

export const initialOrdenesCompra = generateOrdenesCompra(50, initialProveedores, initialInventory);
export const initialCodigosTrabajo: CodigoTrabajo[] = [
    {
        id: "COD-001",
        codigo: "COD-001",
        nombre: "Punto de red certificado Cat 6A",
        descripcion: "Instalación y certificación de punto de red categoría 6A, incluye cableado hasta 30 metros.",
        manoDeObra: 85000,
        materiales: [
            { id: "M1", inventarioId: "INV-001", nombre: "Cable UTP Cat 6A", cantidad: 30, valorUnitario: 2500 },
            { id: "M2", nombre: "Conector RJ45", cantidad: 2, valorUnitario: 3500 },
            { id: "M3", nombre: "Face Plate", cantidad: 1, valorUnitario: 8000 }
        ],
        costoTotalMateriales: 90000,
        costoTotal: 175000,
        fechaCreacion: new Date(2024, 0, 15)
    },
    {
        id: "COD-002",
        codigo: "COD-002",
        nombre: "Salida de iluminación LED",
        descripcion: "Instalación de punto de luz LED, incluye cableado y conexión a tablero.",
        manoDeObra: 65000,
        materiales: [
            { id: "M4", nombre: "Cable #12 THHN", cantidad: 15, valorUnitario: 1800 },
            { id: "M5", nombre: "Interruptor sencillo", cantidad: 1, valorUnitario: 12000 }
        ],
        costoTotalMateriales: 39000,
        costoTotal: 104000,
        fechaCreacion: new Date(2024, 1, 10)
    },
    {
        id: "COD-003",
        codigo: "COD-003",
        nombre: "Tablero de distribución 12 circuitos",
        descripcion: "Montaje y conexionado de tablero eléctrico principal con protecciones.",
        manoDeObra: 250000,
        materiales: [
            { id: "M7", nombre: "Tablero 12 circuitos", cantidad: 1, valorUnitario: 180000 },
            { id: "M8", nombre: "Breaker 20A", cantidad: 6, valorUnitario: 25000 }
        ],
        costoTotalMateriales: 330000,
        costoTotal: 580000,
        fechaCreacion: new Date(2024, 2, 5)
    }
];

export const initialTrabajos: Cotizacion[] = [
    {
        id: "COT-001",
        numero: "COT-001",
        tipo: "NORMAL",
        fecha: new Date(),
        clienteId: "CLI-001",
        cliente: {
            id: "CLI-001",
            nombre: "Empresa Demo S.A.S",
            documento: "900.123.456-7",
            direccion: "Calle 123 # 45-67",
            telefono: "300 123 4567",
            correo: "contacto@demo.com",
            contactoPrincipal: "Gerente General",
            fechaCreacion: new Date()
        },
        descripcionTrabajo: "Mantenimiento General",
        items: [],
        subtotal: 5000000,
        aiuAdmin: 0, aiuImprevistos: 0, aiuUtilidad: 0, iva: 950000, total: 5950000,
        estado: "APROBADA"
    }
];
