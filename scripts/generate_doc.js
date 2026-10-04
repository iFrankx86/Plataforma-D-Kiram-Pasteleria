import fs from 'fs';
import path from 'path';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType,
  ShadingType
} from 'docx';

const BORDEAUX = '6B1B09';
const GOLD = 'C88A2C';
const LIGHT_BG = 'FBF7F2';
const DARK_TEXT = '2D2422';
const GRAY_BORDER = 'CCCCCC';

function createTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        size: 38,
        bold: true,
        color: BORDEAUX,
        font: 'Arial'
      })
    ]
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 300 },
    children: [
      new TextRun({
        text,
        size: 22,
        bold: true,
        color: GOLD,
        font: 'Arial'
      })
    ]
  });
}

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text,
        size: 26,
        bold: true,
        color: BORDEAUX,
        font: 'Arial'
      })
    ]
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        size: 22,
        bold: true,
        color: GOLD,
        font: 'Arial'
      })
    ]
  });
}

function createParagraph(text, isBold = false) {
  return new Paragraph({
    spacing: { before: 80, after: 100, line: 276 },
    children: [
      new TextRun({
        text,
        size: 20,
        bold: isBold,
        color: DARK_TEXT,
        font: 'Calibri'
      })
    ]
  });
}

function createBullet(text, boldPrefix = '') {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60, line: 260 },
    children: [
      ...(boldPrefix ? [new TextRun({ text: boldPrefix + ' ', bold: true, size: 20, color: BORDEAUX, font: 'Calibri' })] : []),
      new TextRun({ text, size: 20, color: DARK_TEXT, font: 'Calibri' })
    ]
  });
}

function createCodeBlock(codeLines) {
  return codeLines.map(line => new Paragraph({
    spacing: { before: 40, after: 40 },
    shading: { type: ShadingType.CLEAR, fill: 'F3EDE6' },
    children: [
      new TextRun({
        text: '  ' + line,
        font: 'Consolas',
        size: 18,
        color: '333333'
      })
    ]
  }));
}

function createTable(headers, rows) {
  const tableRows = [
    new TableRow({
      children: headers.map(h => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: BORDEAUX },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 19, font: 'Arial' })
            ]
          })
        ]
      }))
    }),
    ...rows.map(row => new TableRow({
      children: row.map(cell => new TableCell({
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: cell, size: 19, font: 'Calibri', color: DARK_TEXT })
            ]
          })
        ]
      }))
    }))
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: GRAY_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY_BORDER },
      left: { style: BorderStyle.SINGLE, size: 1, color: GRAY_BORDER },
      right: { style: BorderStyle.SINGLE, size: 1, color: GRAY_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: GRAY_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: GRAY_BORDER }
    },
    rows: tableRows
  });
}

async function generate() {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: [
        createTitle("INFORME TÉCNICO DE INGENIERÍA DE SOFTWARE"),
        createSubtitle("PLATAFORMA INTEGRAL POS, GESTIÓN COMERCIAL & KÁRDEX CLOUD EN TIEMPO REAL"),
        
        createParagraph("FICHA DE HOMOLOGACIÓN Y CONTROL TÉCNICO:", true),
        createTable(
          ["Parámetro Técnico", "Especificación de Ingeniería"],
          [
            ["Aplicación / Dominio", "D'Kiram Pastelería Fina & Cafetería Artesanal"],
            ["Rol de Autoría", "Staff / Senior Software Architect & Lead Cloud Engineer"],
            ["Versión del Software", "v2.4.0 (Enterprise Cloud & Offline-Resilient)"],
            ["Stack Frontend", "React 19 + TypeScript (Strict) + Vite 6 + Tailwind CSS v4"],
            ["Motor de Base de Datos", "Google Firebase Firestore NoSQL Database (ID: ai-studio-dkirampastelera-665e9d89-8a5f-4239-b603-233a5ae6e4e6)"],
            ["Infraestructura Cloud", "Google Cloud Platform (us-west1) / Vercel Edge Global Network"],
            ["Seguridad & Permisos", "Reglas declarativas Firestore Rules + Control RBAC por Roles"]
          ]
        ),
        
        new Paragraph({ spacing: { before: 200 } }),

        createHeading1("1. RESUMEN EJECUTIVO & OBJETIVOS ESTRATÉGICOS"),
        createParagraph("El presente documento técnico certifica el diseño, la construcción arquitectónica y el despliegue del sistema operativo comercial de D'Kiram Pastelería. El objetivo principal es resolver y erradicar los puntos críticos identificados en la operación previa:"),
        createBullet("Descuadre y fuga de efectivo físico en turnos diarios por falta de trazabilidad en cobros mixtos (Efectivo, Yape y Plin).", "1. Control de Tesorería:"),
        createBullet("Desabastecimiento de insumos y porciones mediante un kárdex transaccional automatizado que descuenta stock en tiempo real en cada venta.", "2. Trazabilidad de Inventario:"),
        createBullet("Implementación de la regla de oro 'Si existe, no lo hagas', impidiendo duplicidad de productos por SKU o coincidencia tipográfica.", "3. Calidad de Datos:"),
        createBullet("Arquitectura híbrida que opera en línea conectada a Google Firestore y conmuta a Journaling local si la conectividad en tienda se interrumpe.", "4. Disponibilidad Continua:"),

        createHeading1("2. MODELO DE NEGOCIO & FLUJO OPERATIVO DE DOMINIO"),
        createParagraph("D'Kiram opera bajo un modelo de comercio minorista y cafetería de pastelería fina. Las dinámicas de negocio se articulan a través de los siguientes perfiles y roles de control de acceso (RBAC):"),
        createBullet("Supervisión global de rentabilidad, consulta de kárdex, anulación controlada de ventas con reversión automática de stock y auditoría de turnos de caja.", "Super Administradora (Arsencia):"),
        createBullet("Operación del mostrador (POS), apertura con saldo base para dar cambio, registro de cobros multidivisa/multipago, y cierre ciego con conciliación de diferencias.", "Administrador / Mostrador (Frank):"),
        createBullet("Control de producción diaria, entradas de horneado matutino, reporte de mermas técnicas y verificación de caducidad de porciones.", "Jefe de Producción (Carlos):"),

        createHeading1("3. ARQUITECTURA DEL SISTEMA EN CAPAS (LAYERED ARCHITECTURE)"),
        createParagraph("La solución sigue un patrón de Arquitectura Desacoplada en Cuatro Capas de Alto Rendimiento:"),
        createBullet("Componentes React 19 optimizados con Tailwind CSS v4, tipografía legible Plus Jakarta Sans, diseño táctil y compatibilidad total con pantallas de tablets y teléfonos móviles de mostrador.", "Capa de Presentación (UI/UX):"),
        createBullet("Lógica de negocio encapsulada en AppContext.tsx con TypeScript estricto. Centraliza el motor del carrito, cálculo de impuestos, descuentos y validaciones previas a la confirmación.", "Capa de Dominio y Estado:"),
        createBullet("Módulo firestoreService.ts que encapsula la API del SDK v12 de Firebase. Implementa listeners onSnapshot para sincronización reactiva bidireccional y escritura por lotes.", "Capa de Integración y Persistencia:"),
        createBullet("Asegurada en la nube de Google mediante firestore.rules para rechazar transacciones inconsistentes y en el cliente con validaciones de interfaz.", "Capa de Seguridad y Auditoría:"),

        createHeading1("4. TOPOLOGÍA DE RED E INFRAESTRUCTURA DE DESPLIEGUE"),
        createParagraph("La plataforma está estructurada en una topología serverless de alta disponibilidad:"),
        createBullet("Navegadores modernos en modo SPA (Single Page Application) en terminales de caja, tablets de salón y celulares de supervisores.", "Terminales Clientes:"),
        createBullet("Vercel Edge Network / Google Cloud Run con distribución CDN global, compresión Brotli y enrutamiento SPA configurado en vercel.json.", "Capa Edge & Hosting:"),
        createBullet("Google Firebase Firestore multi-región gestionado en Google Cloud Platform (ID: gen-lang-client-0465390353). Proporciona sincronización por WebSockets/gRPC en tiempo real.", "Base de Datos en la Nube:"),

        createHeading1("5. MODELO DE DATOS Y ESTRUCTURA DE LA BASE DE DATOS (FIRESTORE)"),
        createParagraph("El almacenamiento utiliza colecciones NoSQL normalizadas en sus identificadores y denormalizadas eficientemente en datos de lectura rápida:"),
        createTable(
          ["Colección Firestore", "Clave Primaria", "Campos Relevantes", "Propósito Operativo"],
          [
            ["products", "id (prod-*)", "sku, name, categoryId, salePrice, costPrice, stockCurrent, active", "Catálogo maestro y control de existencias."],
            ["categories", "id (cat-*)", "name, slug, icon, active, order", "Taxonomía de pasteles, porciones y bebidas."],
            ["sales", "id (sale-*)", "code (V-*), cashRegisterId, total, items[], payments[], status", "Registro fiscal y detalle de transacciones POS."],
            ["cashRegisters", "id (caja-*)", "employeeId, openingAmount, expectedCash, countedCash, status", "Turnos de caja y arqueos con diferencias."],
            ["cashMovements", "id (mov-*)", "cashRegisterId, type (INGRESO, EGRESO, VENTA), amount, reason", "Kárdex de flujo de efectivo en mostrador."],
            ["inventoryMovements", "id (inv-*)", "productId, type (VENTA, ENTRADA, MERMA), quantity, stockAfter", "Kárdex físico de entradas y salidas de bodega."],
            ["employees & shifts", "id (emp-*, shf-*)", "firstName, lastName, role, date, startTime, status", "Gestión de personal y cuadrantes de turno."],
            ["auditLogs", "id (aud-*)", "userId, action, entity, entityId, details, createdAt", "Bitácora forense de seguridad inmutable."]
          ]
        ),

        new Paragraph({ spacing: { before: 200 } }),

        createHeading1("6. TÉCNICAS DE PROGRAMACIÓN Y BUENAS PRÁCTICAS IMPLEMENTADAS"),
        createParagraph("El código fuente ha sido desarrollado bajo los estándares de ingeniería de software más rigurosos:"),
        createBullet("Todo el dominio (ventas, cajas, productos) cuenta con interfaces y tipos estrictos en types/index.ts, previniendo errores de puntero nulo y cálculos monetarios erróneos.", "Tipado Estricto (TypeScript 5.7+):"),
        createBullet("Patrón Outbox persistente en localStorage ('dkiram_pending_sync_queue'). Las ventas realizadas sin internet se confirman de inmediato en el POS, imprimen tickets y descuentan stock local. Al volver la conectividad, un motor reactivo (listeners 'online' y heartbeat) vacía la cola secuencialmente en Google Firestore.", "Gestión de Estado Offline-First & Cola Outbox:"),
        createBullet("Los observadores en tiempo real (onSnapshot) concilian las ventas remotas con la cola local pendiente, garantizando que ninguna venta offline sea sobreescrita o borrada por respuestas del servidor.", "Reconciliación sin Pérdida de Datos:"),
        createBullet("El dinero no se trata con sumas flotantes descuidadas. Se aplican redondeos normalizados a 2 decimales (toFixed(2) y Math.round) para cuadrar centavo a centavo.", "Precisión Monetaria Impecable:"),
        createBullet("Una venta no se considera cerrada si la suma de sus métodos de pago (ej. S/ 10 Efectivo + S/ 15 Yape) no coincide al 100% con el total del carrito.", "Idempotencia y Validación Cruzada:"),

        createHeading1("7. ESTADO DE LA BASE DE DATOS Y LISTA DE PRODUCCIÓN"),
        createParagraph("Actualmente, la infraestructura se encuentra plenamente operativa:"),
        createBullet("ai-studio-dkirampastelera-665e9d89-8a5f-4239-b603-233a5ae6e4e6", "ID de Base de Datos Activa:"),
        createBullet("Desplegadas y validadas contra accesos no autorizados e inyecciones.", "Reglas de Seguridad (firestore.rules):"),
        createBullet("Catálogo de productos de mostrador y del cuaderno de notas sincronizados con SKU único.", "Semillero de Datos (Seeding):"),
        createBullet("vercel.json configurado con soporte para rutas de Vite y variables de entorno documentadas en .env.example.", "Compatibilidad con Vercel:")
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve('public', 'INFORME_TECNICO_DKIRAM_PASTELERIA.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document generated successfully at: ${outputPath}`);
}

generate().catch(console.error);
