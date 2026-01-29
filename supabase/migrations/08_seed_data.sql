-- =============================================
-- DATOS DE PRUEBA - DMRE-ELECTRIC
-- =============================================
-- Ejecutar DESPUÉS de los scripts 01-07
-- =============================================

-- =============================================
-- PROVEEDORES (5 registros)
-- =============================================
INSERT INTO public.proveedores (codigo, nombre, nit, categoria, direccion, ciudad, correo, telefono, contacto, calificacion) VALUES
('PROV-001', 'Electricos del Valle S.A.S', '900123456-7', 'MATERIALES', 'Calle 15 #45-23', 'Cali', 'ventas@electricosvalle.com', '3201234567', 'Carlos Mendoza', 5),
('PROV-002', 'Ferretería Industrial Ltda', '800234567-8', 'MATERIALES', 'Carrera 10 #20-15', 'Bogotá', 'contacto@ferreindustrial.com', '3112345678', 'María López', 4),
('PROV-003', 'Conductores y Cables S.A', '900345678-9', 'MATERIALES', 'Av. Industrial #100-50', 'Medellín', 'ventas@condcables.com', '3023456789', 'Pedro Gómez', 5),
('PROV-004', 'Servicios Técnicos Especializados', '800456789-0', 'SERVICIOS', 'Calle 80 #30-45', 'Barranquilla', 'info@sertec.com', '3134567890', 'Ana Martínez', 4),
('PROV-005', 'Dotaciones y EPP Colombia', '900567890-1', 'MIXTO', 'Carrera 50 #10-20', 'Cali', 'ventas@dotaepp.com', '3045678901', 'Luis Rodríguez', 5);

-- =============================================
-- CLIENTES (5 registros)
-- =============================================
INSERT INTO public.clientes (codigo, nombre, tipo_documento, documento, direccion, ciudad, correo, telefono, contacto_principal) VALUES
('CLI-001', 'Constructora Andina S.A.S', 'NIT', '900111222-3', 'Calle 100 #15-20 Oficina 501', 'Bogotá', 'proyectos@construandina.com', '3201112233', 'Ing. Roberto Sánchez'),
('CLI-002', 'Edificaciones del Pacífico Ltda', 'NIT', '800222333-4', 'Av. 6N #25-50', 'Cali', 'gerencia@edipaci.com', '3112223344', 'Arq. Laura González'),
('CLI-003', 'Inmobiliaria Santa Fe S.A', 'NIT', '900333444-5', 'Carrera 7 #72-41 Piso 8', 'Bogotá', 'comercial@inmsantafe.com', '3023334455', 'Dr. Fernando Ruiz'),
('CLI-004', 'Centro Comercial Plaza Mayor', 'NIT', '800444555-6', 'Calle 36 #66-70', 'Medellín', 'administracion@ccplazamayor.com', '3134445566', 'Adm. Patricia Vargas'),
('CLI-005', 'Hospital Regional del Norte', 'NIT', '900555666-7', 'Carrera 45 #80-100', 'Barranquilla', 'infraestructura@hrn.gov.co', '3045556677', 'Ing. Andrés Mejía');

-- =============================================
-- EMPLEADOS (5 registros)
-- =============================================
INSERT INTO public.empleados (codigo, nombre_completo, cedula, direccion, ciudad, telefono, correo, cargo, area, fecha_ingreso, salario_base, eps, arl, estado) VALUES
('EMP-001', 'Juan Carlos Pérez Rodríguez', '1098765432', 'Calle 45 #12-34', 'Cali', '3156789012', 'jcperez@dmreelectric.com', 'Ingeniero Electricista', 'Operaciones', '2023-01-15', 4500000, 'Sura EPS', 'Sura ARL', 'ACTIVO'),
('EMP-002', 'María Fernanda López García', '1087654321', 'Carrera 20 #56-78', 'Cali', '3167890123', 'mflopez@dmreelectric.com', 'Técnico Electricista', 'Operaciones', '2023-03-01', 2800000, 'Nueva EPS', 'Positiva', 'ACTIVO'),
('EMP-003', 'Carlos Alberto Gómez Díaz', '1076543210', 'Av. 5N #23-45', 'Cali', '3178901234', 'cagomez@dmreelectric.com', 'Técnico Electricista', 'Operaciones', '2023-05-15', 2800000, 'Sanitas', 'Colmena', 'ACTIVO'),
('EMP-004', 'Sandra Milena Torres Vega', '1065432109', 'Calle 70 #8-90', 'Cali', '3189012345', 'smtorres@dmreelectric.com', 'Auxiliar Administrativa', 'Administración', '2022-08-01', 1800000, 'Sura EPS', 'Sura ARL', 'ACTIVO'),
('EMP-005', 'Diego Alejandro Martínez Ruíz', '1054321098', 'Carrera 66 #15-23', 'Cali', '3190123456', 'damartinez@dmreelectric.com', 'Conductor/Ayudante', 'Logística', '2024-01-10', 1600000, 'Nueva EPS', 'Positiva', 'ACTIVO');

-- =============================================
-- TRABAJOS/PROYECTOS (5 registros)
-- =============================================
INSERT INTO public.trabajos (codigo, nombre, cliente_id, descripcion, ubicacion, direccion, fecha_inicio, fecha_fin_estimada, estado, presupuesto) VALUES
('OBR-2024-001', 'Instalación eléctrica Torre Empresarial Andina', (SELECT id FROM clientes WHERE codigo = 'CLI-001'), 'Instalación completa sistema eléctrico edificio 15 pisos', 'Bogotá Norte', 'Calle 100 #15-20', '2024-02-01', '2024-08-30', 'EN_EJECUCION', 450000000),
('OBR-2024-002', 'Remodelación eléctrica Centro Comercial', (SELECT id FROM clientes WHERE codigo = 'CLI-004'), 'Actualización tableros y circuitos zona food court', 'Medellín El Poblado', 'Calle 36 #66-70', '2024-03-15', '2024-05-30', 'APROBADO', 85000000),
('OBR-2024-003', 'Mantenimiento preventivo Hospital', (SELECT id FROM clientes WHERE codigo = 'CLI-005'), 'Mantenimiento anual sistemas eléctricos críticos', 'Barranquilla Centro', 'Carrera 45 #80-100', '2024-01-01', '2024-12-31', 'EN_EJECUCION', 120000000),
('OBR-2024-004', 'Instalación iluminación LED Edificio Pacífico', (SELECT id FROM clientes WHERE codigo = 'CLI-002'), 'Cambio sistema iluminación a LED eficiente', 'Cali Sur', 'Av. 6N #25-50', '2024-04-01', '2024-05-15', 'COTIZADO', 35000000),
('OBR-2024-005', 'Ampliación capacidad eléctrica Torre Santa Fe', (SELECT id FROM clientes WHERE codigo = 'CLI-003'), 'Ampliación subestación y nuevos circuitos', 'Bogotá Chapinero', 'Carrera 7 #72-41', '2024-05-01', '2024-09-30', 'COTIZADO', 280000000);

-- =============================================
-- INVENTARIO (10 registros)
-- =============================================
INSERT INTO public.inventario (sku, codigo, nombre, descripcion, categoria, ubicacion, unidad, cantidad, stock_minimo, valor_unitario, proveedor_id) VALUES
('SKU-001', 'CAB-THW-12', 'Cable THW #12 AWG', 'Cable de cobre THW calibre 12 AWG 600V', 'MATERIAL', 'BODEGA', 'ML', 5000, 1000, 2500, (SELECT id FROM proveedores WHERE codigo = 'PROV-003')),
('SKU-002', 'CAB-THW-10', 'Cable THW #10 AWG', 'Cable de cobre THW calibre 10 AWG 600V', 'MATERIAL', 'BODEGA', 'ML', 3500, 800, 3800, (SELECT id FROM proveedores WHERE codigo = 'PROV-003')),
('SKU-003', 'CAB-THW-8', 'Cable THW #8 AWG', 'Cable de cobre THW calibre 8 AWG 600V', 'MATERIAL', 'BODEGA', 'ML', 2000, 500, 5500, (SELECT id FROM proveedores WHERE codigo = 'PROV-003')),
('SKU-004', 'TUB-EMT-1-2', 'Tubería EMT 1/2 pulgada', 'Tubería metálica EMT 1/2 pulgada x 3m', 'MATERIAL', 'BODEGA', 'UND', 200, 50, 18500, (SELECT id FROM proveedores WHERE codigo = 'PROV-001')),
('SKU-005', 'TUB-EMT-3-4', 'Tubería EMT 3/4 pulgada', 'Tubería metálica EMT 3/4 pulgada x 3m', 'MATERIAL', 'BODEGA', 'UND', 150, 40, 24000, (SELECT id FROM proveedores WHERE codigo = 'PROV-001')),
('SKU-006', 'TAB-6CTO', 'Tablero 6 circuitos', 'Tablero de distribución 6 circuitos monofásico', 'MATERIAL', 'BODEGA', 'UND', 25, 10, 85000, (SELECT id FROM proveedores WHERE codigo = 'PROV-002')),
('SKU-007', 'TAB-12CTO', 'Tablero 12 circuitos', 'Tablero de distribución 12 circuitos trifásico', 'MATERIAL', 'BODEGA', 'UND', 15, 5, 180000, (SELECT id FROM proveedores WHERE codigo = 'PROV-002')),
('SKU-008', 'TOM-DOBLE', 'Tomacorriente doble', 'Tomacorriente doble con polo a tierra', 'MATERIAL', 'BODEGA', 'UND', 500, 100, 12000, (SELECT id FROM proveedores WHERE codigo = 'PROV-001')),
('SKU-009', 'INT-SENC', 'Interruptor sencillo', 'Interruptor sencillo 15A 120V', 'MATERIAL', 'BODEGA', 'UND', 400, 80, 8500, (SELECT id FROM proveedores WHERE codigo = 'PROV-001')),
('SKU-010', 'CASCO-SEG', 'Casco de seguridad', 'Casco dieléctrico clase E', 'EPP', 'BODEGA', 'UND', 20, 5, 45000, (SELECT id FROM proveedores WHERE codigo = 'PROV-005'));

-- =============================================
-- CÓDIGOS DE TRABAJO / APUs (5 registros)
-- =============================================
INSERT INTO public.codigos_trabajo (codigo, nombre, descripcion, unidad, mano_de_obra, costo_materiales, costo_total, precio_venta, margen) VALUES
('APU-001', 'Punto eléctrico iluminación', 'Instalación punto de iluminación incluye tubería, cableado y accesorios', 'UND', 35000, 45000, 80000, 120000, 50),
('APU-002', 'Punto tomacorriente doble', 'Instalación tomacorriente doble con polo a tierra', 'UND', 40000, 55000, 95000, 140000, 47),
('APU-003', 'Acometida monofásica residencial', 'Instalación acometida eléctrica monofásica hasta 10m', 'GL', 150000, 280000, 430000, 650000, 51),
('APU-004', 'Tablero distribución 12 circuitos', 'Suministro e instalación tablero 12 circuitos con breakers', 'UND', 180000, 450000, 630000, 950000, 51),
('APU-005', 'Tendido cable bandeja portacable', 'Tendido de cable en bandeja portacable incluye amarre', 'ML', 8000, 5000, 13000, 20000, 54);

-- =============================================
-- CUENTAS BANCARIAS (3 registros)
-- =============================================
INSERT INTO public.cuentas_bancarias (nombre, tipo, banco, numero_cuenta, tipo_cuenta, titular, saldo_inicial, saldo_actual, principal) VALUES
('Cuenta Principal Bancolombia', 'BANCO', 'Bancolombia', '12345678901', 'Corriente', 'DMRE Electric S.A.S', 50000000, 85000000, true),
('Cuenta Ahorros Davivienda', 'BANCO', 'Davivienda', '98765432101', 'Ahorros', 'DMRE Electric S.A.S', 10000000, 15000000, false),
('Caja Menor', 'EFECTIVO', NULL, NULL, NULL, 'Caja Menor Oficina', 2000000, 1500000, false);

-- =============================================
-- VEHÍCULOS (3 registros)
-- =============================================
INSERT INTO public.vehiculos (placa, tipo, marca, modelo, anno, color, conductor_asignado, vencimiento_soat, vencimiento_tecnomecanica, vencimiento_seguro, kilometraje_actual, estado) VALUES
('ABC123', 'Camioneta', 'Chevrolet', 'D-MAX', 2022, 'Blanco', 'Diego Martínez', '2025-03-15', '2025-06-20', '2025-03-15', 45000, 'ACTIVO'),
('XYZ789', 'Van', 'Renault', 'Kangoo', 2021, 'Gris', 'Juan Pérez', '2025-02-28', '2025-05-10', '2025-02-28', 62000, 'ACTIVO'),
('DEF456', 'Camioneta', 'Toyota', 'Hilux', 2023, 'Negro', 'Carlos Gómez', '2025-08-01', '2025-11-15', '2025-08-01', 28000, 'ACTIVO');

-- =============================================
-- COTIZACIONES (3 registros)
-- =============================================
INSERT INTO public.cotizaciones (numero, tipo, fecha, cliente_id, trabajo_id, descripcion_trabajo, subtotal, aiu_admin, aiu_imprevistos, aiu_utilidad, valor_aiu, iva_porcentaje, iva, total, estado) VALUES
('COT-2024-001', 'NORMAL', '2024-01-15', (SELECT id FROM clientes WHERE codigo = 'CLI-001'), (SELECT id FROM trabajos WHERE codigo = 'OBR-2024-001'), 'Instalación eléctrica completa edificio 15 pisos', 380000000, 5, 3, 7, 57000000, 19, 83030000, 520030000, 'APROBADA'),
('COT-2024-002', 'NORMAL', '2024-02-20', (SELECT id FROM clientes WHERE codigo = 'CLI-004'), (SELECT id FROM trabajos WHERE codigo = 'OBR-2024-002'), 'Remodelación eléctrica zona food court', 72000000, 5, 2, 5, 8640000, 19, 15321600, 95961600, 'PENDIENTE'),
('COT-2024-003', 'SIMPLIFICADA', '2024-03-10', (SELECT id FROM clientes WHERE codigo = 'CLI-002'), (SELECT id FROM trabajos WHERE codigo = 'OBR-2024-004'), 'Cambio iluminación LED', 28000000, 5, 2, 5, 3360000, 19, 5958400, 37318400, 'ENVIADA');

-- =============================================
-- FACTURAS (2 registros)
-- =============================================
INSERT INTO public.facturas (numero, cotizacion_id, cliente_id, fecha_emision, fecha_vencimiento, subtotal, iva, valor_total, anticipo_recibido, retencion_fuente, saldo_pendiente, estado) VALUES
('FAC-2024-001', (SELECT id FROM cotizaciones WHERE numero = 'COT-2024-001'), (SELECT id FROM clientes WHERE codigo = 'CLI-001'), '2024-02-01', '2024-03-01', 130000000, 24700000, 154700000, 50000000, 5200000, 99500000, 'PARCIAL'),
('FAC-2024-002', (SELECT id FROM cotizaciones WHERE numero = 'COT-2024-003'), (SELECT id FROM clientes WHERE codigo = 'CLI-002'), '2024-03-15', '2024-04-15', 28000000, 5320000, 33320000, 0, 0, 33320000, 'PENDIENTE');

-- =============================================
-- MOVIMIENTOS FINANCIEROS (5 registros)
-- =============================================
INSERT INTO public.movimientos_financieros (fecha, tipo, cuenta_id, categoria, tercero, concepto, valor) VALUES
('2024-01-10', 'INGRESO', (SELECT id FROM cuentas_bancarias WHERE nombre = 'Cuenta Principal Bancolombia'), 'VENTAS', 'Constructora Andina S.A.S', 'Anticipo proyecto Torre Empresarial', 50000000),
('2024-01-15', 'EGRESO', (SELECT id FROM cuentas_bancarias WHERE nombre = 'Cuenta Principal Bancolombia'), 'PROVEEDORES', 'Conductores y Cables S.A', 'Compra cables proyecto Andina', 15000000),
('2024-01-31', 'EGRESO', (SELECT id FROM cuentas_bancarias WHERE nombre = 'Cuenta Principal Bancolombia'), 'NOMINA', 'Nómina Enero', 'Pago nómina empleados enero 2024', 12500000),
('2024-02-05', 'INGRESO', (SELECT id FROM cuentas_bancarias WHERE nombre = 'Cuenta Principal Bancolombia'), 'VENTAS', 'Hospital Regional del Norte', 'Factura mantenimiento enero', 10000000),
('2024-02-15', 'EGRESO', (SELECT id FROM cuentas_bancarias WHERE nombre = 'Caja Menor'), 'OTROS', 'Varios', 'Gastos menores operación', 500000);

-- =============================================
-- GASTOS VEHÍCULOS (5 registros)
-- =============================================
INSERT INTO public.gastos_vehiculos (vehiculo_id, fecha, tipo, descripcion, kilometraje, valor, proveedor) VALUES
((SELECT id FROM vehiculos WHERE placa = 'ABC123'), '2024-01-15', 'COMBUSTIBLE', 'Tanqueo completo', 45200, 180000, 'Estación Terpel'),
((SELECT id FROM vehiculos WHERE placa = 'ABC123'), '2024-02-01', 'PEAJE', 'Peajes ruta Cali-Bogotá', 45800, 95000, 'Concesiones'),
((SELECT id FROM vehiculos WHERE placa = 'XYZ789'), '2024-01-20', 'MANTENIMIENTO', 'Cambio aceite y filtros', 61500, 450000, 'Taller Renault'),
((SELECT id FROM vehiculos WHERE placa = 'DEF456'), '2024-02-10', 'COMBUSTIBLE', 'Tanqueo completo', 28500, 220000, 'Estación Texaco'),
((SELECT id FROM vehiculos WHERE placa = 'XYZ789'), '2024-02-15', 'LAVADO', 'Lavado general', 62000, 35000, 'Lavadero Express');

-- =============================================
-- AGENDA/TAREAS (5 registros)
-- =============================================
INSERT INTO public.agenda (titulo, descripcion, fecha_vencimiento, prioridad, estado) VALUES
('Revisar cotización Centro Comercial', 'Verificar cantidades y precios cotización CC Plaza Mayor', '2024-02-28', 'ALTA', 'PENDIENTE'),
('Reunión cliente Constructora Andina', 'Reunión avance proyecto Torre Empresarial', '2024-02-25', 'ALTA', 'PENDIENTE'),
('Comprar materiales proyecto Hospital', 'Solicitar cables y tubería para mantenimiento', '2024-02-20', 'MEDIA', 'EN_PROCESO'),
('Renovar SOAT vehículo XYZ789', 'Renovar SOAT van Kangoo antes del 28 febrero', '2024-02-25', 'ALTA', 'PENDIENTE'),
('Capacitación seguridad eléctrica', 'Programar capacitación anual para técnicos', '2024-03-15', 'BAJA', 'PENDIENTE');

-- =============================================
-- DOTACIÓN (3 registros)
-- =============================================
INSERT INTO public.dotacion_items (codigo, descripcion, categoria, genero) VALUES
('DOT-001', 'Camisa manga larga dril', 'UNIFORME', 'MASCULINO'),
('DOT-002', 'Pantalón cargo dril', 'UNIFORME', 'UNISEX'),
('DOT-003', 'Botas dieléctricas', 'EPP', 'UNISEX');

INSERT INTO public.dotacion_variantes (dotacion_id, talla, color, cantidad_disponible, cantidad_minima, valor_unitario) VALUES
((SELECT id FROM dotacion_items WHERE codigo = 'DOT-001'), 'M', 'Azul', 10, 5, 65000),
((SELECT id FROM dotacion_items WHERE codigo = 'DOT-001'), 'L', 'Azul', 8, 5, 65000),
((SELECT id FROM dotacion_items WHERE codigo = 'DOT-002'), '32', 'Azul Oscuro', 6, 3, 75000),
((SELECT id FROM dotacion_items WHERE codigo = 'DOT-002'), '34', 'Azul Oscuro', 8, 3, 75000),
((SELECT id FROM dotacion_items WHERE codigo = 'DOT-003'), '40', 'Negro', 4, 2, 180000),
((SELECT id FROM dotacion_items WHERE codigo = 'DOT-003'), '42', 'Negro', 5, 2, 180000);

-- =============================================
-- NOVEDADES NÓMINA (3 registros)
-- =============================================
INSERT INTO public.novedades_nomina (empleado_id, periodo, fecha, tipo, descripcion, cantidad, valor_unitario, valor_total, es_deduccion) VALUES
((SELECT id FROM empleados WHERE codigo = 'EMP-001'), '2024-02', '2024-02-10', 'HORA_EXTRA_DIURNA', 'Horas extra proyecto Andina', 8, 28125, 225000, false),
((SELECT id FROM empleados WHERE codigo = 'EMP-002'), '2024-02', '2024-02-15', 'HORA_EXTRA_NOCTURNA', 'Trabajo nocturno emergencia hospital', 4, 24500, 98000, false),
((SELECT id FROM empleados WHERE codigo = 'EMP-004'), '2024-02', '2024-02-01', 'PRESTAMO', 'Préstamo personal', 1, 500000, 500000, true);

-- =============================================
-- FIN DATOS DE PRUEBA
-- =============================================
SELECT 'Datos de prueba insertados correctamente' as mensaje;
