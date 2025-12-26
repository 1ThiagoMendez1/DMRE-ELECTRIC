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
    Permission
} from "@/types/sistema";
import { addDays, subDays } from "date-fns";

export const initialUsers: User[] = [
    {
        id: "USR-001",
        name: "Admin Sistema",
        email: "admin@dmre.com",
        role: "ADMIN",
        avatar: "https://github.com/shadcn.png"
    },
    {
        id: "USR-002",
        name: "Ingeniero Jefe",
        email: "ingenieria@dmre.com",
        role: "ENGINEER",
        avatar: ""
    },
    {
        id: "USR-003",
        name: "Cliente Demo",
        email: "cliente@empresa.com",
        role: "CLIENT",
        avatar: ""
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
    const start = new Date(startYear, 0, 1).getTime();
    const end = new Date(endYear, 11, 31).getTime();
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

const generateInventario = (count: number): InventarioItem[] => {
    return Array.from({ length: count }, (_, i) => {
        const precioBase = randomInt(5000, 500000);
        const isCompuesto = seededRandom() > 0.8;

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
            materiales: isCompuesto ? Array.from({ length: randomInt(2, 4) }, (_, j) => ({
                id: `MAT-${i}-${j}`,
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
                valorTotal: itemInv.valorUnitario * cantidad
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
                fechaEmision: addDays(c.fecha, randomInt(5, 15)),
                fechaVencimiento: addDays(c.fecha, randomInt(35, 45)),
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
    return Array.from({ length: count }, (_, i) => ({
        id: `VEH-${i + 1}`,
        placa: `${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}-${randomInt(100, 999)}`,
        marcaModelo: randomItem(["Chevrolet N300", "Renault Kangoo", "Toyota Hilux", "Jac 1040"]),
        conductorAsignado: `${randomItem(nombres)} ${randomItem(apellidos)}`,
        vencimientoSoat: addDays(new Date(), randomInt(-30, 300)),
        vencimientoTecnomecanica: addDays(new Date(), randomInt(-30, 300)),
        vencimientoSeguro: addDays(new Date(), randomInt(-30, 300))
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
        const pagado = total * (randomInt(0, 80) / 100);
        return {
            id: `R-CXP-${i + 1}`,
            proveedorId: randomItem(proveedores).id,
            proveedor: randomItem(proveedores),
            numeroFacturaProveedor: `REF-${randomInt(1000, 9999)}`,
            fecha: randomDate(2024, 2025),
            concepto: 'Compra de Materiales',
            valorTotal: total,
            valorPagado: pagado,
            saldoPendiente: total - pagado
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
        valorCalculado: randomInt(20000, 100000)
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
            detalle: '{}'
        };
    });
};


// --- NEW GENERATORS ---

const generateDotacionItems = (): DotacionItem[] => [
    { id: 'DOT-1', descripcion: 'Camisa Polo Institucional', talla: 'M', cantidadDisponible: 50 },
    { id: 'DOT-2', descripcion: 'Botas de Seguridad Dielectricas', talla: '40', cantidadDisponible: 20 },
    { id: 'DOT-3', descripcion: 'Casco de Seguridad', talla: 'Unica', cantidadDisponible: 30 },
    { id: 'DOT-4', descripcion: 'Guantes de Carnaza', talla: 'L', cantidadDisponible: 100 },
];

const generateEntregasDotacion = (count: number, empleados: Empleado[], items: DotacionItem[]): EntregaDotacion[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `ENT-DOT-${i + 1}`,
        fecha: randomDate(2024, 2025),
        empleadoId: randomItem(empleados).id,
        empleado: randomItem(empleados),
        items: [{
            dotacionId: items[0].id,
            descripcion: items[0].descripcion,
            cantidad: randomInt(1, 2)
        }],
        observacion: "Entrega trimestral"
    }));
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
export const initialInventory = generateInventario(100);
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
export const initialProveedores = generateProveedores(20);
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
