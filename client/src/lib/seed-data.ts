import { hashPassword } from './auth';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function seedDatabase() {
  // Import database functions
  const { execute, query } = await import('./database');
  
  // Check if data already exists with better control
  try {
    const existingProducts = query('SELECT COUNT(*) as count FROM products');
    if (existingProducts[0]?.count > 0) {
      return; // Data already seeded
    }
  } catch (error) {
    // Tables might not exist yet, continue with seeding
  }
  
  console.log('Starting database seeding...');

  // Spanish IVA taxes for grocery
  const taxes = [
    { code: 'IVA21', name: 'IVA General', tax_rate: 0.21 },
    { code: 'IVA10', name: 'IVA Reducido', tax_rate: 0.10 },
    { code: 'IVA4', name: 'IVA Superreducido', tax_rate: 0.04 }
  ];

  // Delivery centers
  const deliveryCenters = [
    { code: 'M-001', name: 'Centro de entrega Madrid-Norte' },
    { code: 'M-002', name: 'Centro de entrega Barcelona-Este' },
    { code: 'M-003', name: 'Centro de entrega Valencia-Sur' },
    { code: 'M-004', name: 'Centro de entrega Sevilla-Centro' },
    { code: 'M-005', name: 'Centro de entrega Alicante-Elche' }
  ];

  // Stores
  const stores = [
    { code: 'ES001', name: 'E.S. Gran VIA', responsible_email: 'responsable@esgranvia.es', delivery_center_code: 'M-005' },
    { code: 'ES002', name: 'Supermercado Central Madrid', responsible_email: 'admin@central.es', delivery_center_code: 'M-001' },
    { code: 'ES003', name: 'Alimentación Barcelona Norte', responsible_email: 'gerente@bcnnorte.es', delivery_center_code: 'M-002' },
    { code: 'ES004', name: 'Super Valencia Plaza', responsible_email: 'director@valencia.es', delivery_center_code: 'M-003' },
    { code: 'ES005', name: 'Mercado Sevilla Centro', responsible_email: 'admin@sevilla.es', delivery_center_code: 'M-004' },
    { code: 'ES006', name: 'Alimentación Gourmet Madrid', responsible_email: 'info@gourmet.es', delivery_center_code: 'M-001' },
    { code: 'ES007', name: 'SuperFresh Barcelona', responsible_email: 'contacto@superfresh.es', delivery_center_code: 'M-002' },
    { code: 'ES008', name: 'La Despensa Valencia', responsible_email: 'pedidos@despensa.es', delivery_center_code: 'M-003' },
    { code: 'ES009', name: 'Andalucía Market', responsible_email: 'ventas@andalucia.es', delivery_center_code: 'M-004' },
    { code: 'ES010', name: 'Costa Blanca Alimentación', responsible_email: 'compras@costablanca.es', delivery_center_code: 'M-005' }
  ];

  // Users - password123 hashed with SHA3 using email as salt
  const users = [
    { email: 'luis@esgranvia.es', store_id: 'ES001', name: 'Luis Romero Pérez', password_hash: hashPassword('password123', 'luis@esgranvia.es') },
    { email: 'maria@central.es', store_id: 'ES002', name: 'María García López', password_hash: hashPassword('password123', 'maria@central.es') },
    { email: 'carlos@bcnnorte.es', store_id: 'ES003', name: 'Carlos Martínez Ruiz', password_hash: hashPassword('password123', 'carlos@bcnnorte.es') },
    { email: 'ana@valencia.es', store_id: 'ES004', name: 'Ana Fernández Torres', password_hash: hashPassword('password123', 'ana@valencia.es') },
    { email: 'pedro@sevilla.es', store_id: 'ES005', name: 'Pedro Sánchez Moreno', password_hash: hashPassword('password123', 'pedro@sevilla.es') },
    { email: 'laura@gourmet.es', store_id: 'ES006', name: 'Laura Jiménez Vázquez', password_hash: hashPassword('password123', 'laura@gourmet.es') },
    { email: 'miguel@superfresh.es', store_id: 'ES007', name: 'Miguel Rodríguez Silva', password_hash: hashPassword('password123', 'miguel@superfresh.es') },
    { email: 'sofia@despensa.es', store_id: 'ES008', name: 'Sofía González Ramos', password_hash: hashPassword('password123', 'sofia@despensa.es') },
    { email: 'javier@andalucia.es', store_id: 'ES009', name: 'Javier Hernández Castro', password_hash: hashPassword('password123', 'javier@andalucia.es') },
    { email: 'elena@costablanca.es', store_id: 'ES010', name: 'Elena Díaz Morales', password_hash: hashPassword('password123', 'elena@costablanca.es') }
  ];

  // Spanish grocery products (100 items)
  const products = [
    // Azúcar y Endulzantes
    { ean: '8410000000001', title: 'Azúcar blanco Día paquete 1 Kg', base_price: 1.00, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '1,00 €/KILO' },
    { ean: '8410000000002', title: 'Azúcar moreno integral 1 Kg', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '1,85 €/KILO' },
    { ean: '8410000000003', title: 'Edulcorante sacarina 300 pastillas', base_price: 2.45, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '2,45 €/UD' },
    { ean: '8410000000004', title: 'Miel de flores 500g', base_price: 3.20, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '6,40 €/KILO' },
    { ean: '8410000000005', title: 'Stevia en polvo 100g', base_price: 4.50, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '45,00 €/KILO' },
    
    // Lácteos
    { ean: '8410000000006', title: 'Leche entera UHT 1L', base_price: 0.89, tax_code: 'IVA4', unit_of_measure: 'L', display_price: '0,89 €/LITRO' },
    { ean: '8410000000007', title: 'Leche semidesnatada UHT 1L', base_price: 0.85, tax_code: 'IVA4', unit_of_measure: 'L', display_price: '0,85 €/LITRO' },
    { ean: '8410000000008', title: 'Yogur natural pack 4 UD', base_price: 1.35, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,34 €/UD' },
    { ean: '8410000000009', title: 'Queso manchego curado 200g', base_price: 4.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '24,25 €/KILO' },
    { ean: '8410000000010', title: 'Mantequilla sin sal 250g', base_price: 2.15, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '8,60 €/KILO' },

    // Cereales y Derivados
    { ean: '8410000000011', title: 'Arroz redondo 1 Kg', base_price: 1.25, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '1,25 €/KILO' },
    { ean: '8410000000012', title: 'Pasta espaguetis 500g', base_price: 0.89, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '1,78 €/KILO' },
    { ean: '8410000000013', title: 'Pan de molde integral 680g', base_price: 1.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '2,13 €/KILO' },
    { ean: '8410000000014', title: 'Harina de trigo 1 Kg', base_price: 0.95, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '0,95 €/KILO' },
    { ean: '8410000000015', title: 'Cereales corn flakes 375g', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '7,60 €/KILO' },

    // Carnes y Embutidos
    { ean: '8410000000016', title: 'Jamón serrano lonchas 100g', base_price: 3.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '39,50 €/KILO' },
    { ean: '8410000000017', title: 'Chorizo ibérico lonchas 80g', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '35,63 €/KILO' },
    { ean: '8410000000018', title: 'Pollo entero fresco 1,5 Kg aprox', base_price: 4.50, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '3,00 €/KILO' },
    { ean: '8410000000019', title: 'Ternera filetes 500g', base_price: 8.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '17,90 €/KILO' },
    { ean: '8410000000020', title: 'Lomo embuchado lonchas 100g', base_price: 4.25, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '42,50 €/KILO' },

    // Pescados y Mariscos
    { ean: '8410000000021', title: 'Salmón ahumado lonchas 100g', base_price: 5.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '59,50 €/KILO' },
    { ean: '8410000000022', title: 'Atún en aceite lata 80g', base_price: 1.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '18,13 €/KILO' },
    { ean: '8410000000023', title: 'Sardinas en aceite pack 3 latas', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,95 €/UD' },
    { ean: '8410000000024', title: 'Mejillones en escabeche lata 115g', base_price: 2.15, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '18,70 €/KILO' },
    { ean: '8410000000025', title: 'Bacalao congelado 400g', base_price: 6.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '17,13 €/KILO' },

    // Frutas y Verduras
    { ean: '8410000000026', title: 'Plátanos de Canarias 1 Kg', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '1,95 €/KILO' },
    { ean: '8410000000027', title: 'Manzanas Golden 1 Kg', base_price: 1.75, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '1,75 €/KILO' },
    { ean: '8410000000028', title: 'Tomates maduros 1 Kg', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '2,45 €/KILO' },
    { ean: '8410000000029', title: 'Patatas para guisar 2 Kg', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '0,93 €/KILO' },
    { ean: '8410000000030', title: 'Cebolla dulce 1 Kg', base_price: 1.25, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '1,25 €/KILO' },

    // Legumbres y Frutos Secos
    { ean: '8410000000031', title: 'Garbanzos cocidos lata 400g', base_price: 0.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '2,38 €/KILO' },
    { ean: '8410000000032', title: 'Lentejas pardinas 500g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '3,70 €/KILO' },
    { ean: '8410000000033', title: 'Almendras crudas 200g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '17,25 €/KILO' },
    { ean: '8410000000034', title: 'Nueces con cáscara 500g', base_price: 4.25, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '8,50 €/KILO' },
    { ean: '8410000000035', title: 'Judías blancas 500g', base_price: 2.15, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '4,30 €/KILO' },

    // Aceites y Vinagres
    { ean: '8410000000036', title: 'Aceite oliva virgen extra 1L', base_price: 4.95, tax_code: 'IVA4', unit_of_measure: 'L', display_price: '4,95 €/LITRO' },
    { ean: '8410000000037', title: 'Aceite girasol 1L', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'L', display_price: '1,85 €/LITRO' },
    { ean: '8410000000038', title: 'Vinagre de Jerez 500ml', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '4,90 €/LITRO' },
    { ean: '8410000000039', title: 'Vinagre balsámico 250ml', base_price: 3.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '15,40 €/LITRO' },
    { ean: '8410000000040', title: 'Aceite oliva suave 500ml', base_price: 2.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '5,90 €/LITRO' },

    // Conservas y Salsas
    { ean: '8410000000041', title: 'Tomate frito lata 400g', base_price: 1.15, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '2,88 €/KILO' },
    { ean: '8410000000042', title: 'Mayonesa clásica 450ml', base_price: 2.25, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '5,00 €/LITRO' },
    { ean: '8410000000043', title: 'Ketchup 570g', base_price: 1.95, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '3,42 €/KILO' },
    { ean: '8410000000044', title: 'Mermelada fresa 340g', base_price: 2.15, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '6,32 €/KILO' },
    { ean: '8410000000045', title: 'Pimientos rojos asados 225g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '8,22 €/KILO' },

    // Bebidas
    { ean: '8410000000046', title: 'Agua mineral 1,5L', base_price: 0.35, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '0,23 €/LITRO' },
    { ean: '8410000000047', title: 'Zumo naranja natural 1L', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'L', display_price: '2,45 €/LITRO' },
    { ean: '8410000000048', title: 'Refresco cola 2L', base_price: 1.95, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '0,98 €/LITRO' },
    { ean: '8410000000049', title: 'Cerveza sin alcohol pack 6', base_price: 2.85, tax_code: 'IVA21', unit_of_measure: 'PACK', display_price: '0,48 €/UD' },
    { ean: '8410000000050', title: 'Vino tinto crianza 750ml', base_price: 4.95, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '6,60 €/LITRO' },

    // Productos de panadería y bollería
    { ean: '8410000000051', title: 'Galletas maría 800g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '2,31 €/KILO' },
    { ean: '8410000000052', title: 'Magdalenas esponjosas pack 12', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,20 €/UD' },
    { ean: '8410000000053', title: 'Tostadas integrales 270g', base_price: 1.65, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '6,11 €/KILO' },
    { ean: '8410000000054', title: 'Bizcocho mármol 400g', base_price: 2.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '7,38 €/KILO' },
    { ean: '8410000000055', title: 'Croissants mantequilla pack 6', base_price: 2.25, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,38 €/UD' },

    // Congelados
    { ean: '8410000000056', title: 'Pizza 4 quesos 350g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '9,86 €/KILO' },
    { ean: '8410000000057', title: 'Verduras parrilla congeladas 400g', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '7,13 €/KILO' },
    { ean: '8410000000058', title: 'Helado vainilla 1L', base_price: 3.95, tax_code: 'IVA4', unit_of_measure: 'L', display_price: '3,95 €/LITRO' },
    { ean: '8410000000059', title: 'Patatas fritas congeladas 750g', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '2,60 €/KILO' },
    { ean: '8410000000060', title: 'Langostinos cocidos 200g', base_price: 5.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '29,75 €/KILO' },

    // Especias y condimentos
    { ean: '8410000000061', title: 'Sal marina fina 1 Kg', base_price: 0.45, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '0,45 €/KILO' },
    { ean: '8410000000062', title: 'Pimienta negra molida 50g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '37,00 €/KILO' },
    { ean: '8410000000063', title: 'Pimentón dulce 75g', base_price: 1.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '19,33 €/KILO' },
    { ean: '8410000000064', title: 'Ajo en polvo 60g', base_price: 1.25, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '20,83 €/KILO' },
    { ean: '8410000000065', title: 'Oregano seco 20g', base_price: 0.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '47,50 €/KILO' },

    // Higiene y limpieza
    { ean: '8410000000066', title: 'Detergente lavadora 40 dosis', base_price: 8.95, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '0,22 €/DOSIS' },
    { ean: '8410000000067', title: 'Suavizante concentrado 1,5L', base_price: 2.85, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '1,90 €/LITRO' },
    { ean: '8410000000068', title: 'Lavavajillas líquido 750ml', base_price: 1.95, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '2,60 €/LITRO' },
    { ean: '8410000000069', title: 'Papel higiénico pack 12 rollos', base_price: 6.45, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,54 €/ROLLO' },
    { ean: '8410000000070', title: 'Servilletas papel pack 100 UD', base_price: 1.25, tax_code: 'IVA21', unit_of_measure: 'PACK', display_price: '0,01 €/UD' },

    // Café e infusiones
    { ean: '8410000000071', title: 'Café molido natural 250g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '13,80 €/KILO' },
    { ean: '8410000000072', title: 'Té verde bolsitas pack 25', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,11 €/UD' },
    { ean: '8410000000073', title: 'Cacao en polvo 400g', base_price: 3.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '9,88 €/KILO' },
    { ean: '8410000000074', title: 'Manzanilla bolsitas pack 20', base_price: 1.65, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,08 €/UD' },
    { ean: '8410000000075', title: 'Café soluble 100g', base_price: 4.25, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '42,50 €/KILO' },

    // Productos infantiles
    { ean: '8410000000076', title: 'Potito verduras y pollo 250g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '7,40 €/KILO' },
    { ean: '8410000000077', title: 'Cereales bebé sin gluten 400g', base_price: 3.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '9,88 €/KILO' },
    { ean: '8410000000078', title: 'Zumo manzana bebé 330ml', base_price: 1.25, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '3,79 €/LITRO' },
    { ean: '8410000000079', title: 'Galletas bebé 180g', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '13,61 €/KILO' },
    { ean: '8410000000080', title: 'Papilla 8 cereales 600g', base_price: 4.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '8,08 €/KILO' },

    // Dulces y aperitivos
    { ean: '8410000000081', title: 'Chocolate con leche 125g', base_price: 1.95, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '15,60 €/KILO' },
    { ean: '8410000000082', title: 'Patatas fritas bolsa 160g', base_price: 1.45, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '9,06 €/KILO' },
    { ean: '8410000000083', title: 'Caramelos surtidos 150g', base_price: 1.25, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '8,33 €/KILO' },
    { ean: '8410000000084', title: 'Frutos secos salados 200g', base_price: 2.95, tax_code: 'IVA21', unit_of_measure: 'UD', display_price: '14,75 €/KILO' },
    { ean: '8410000000085', title: 'Chicles sin azúcar pack 4', base_price: 1.85, tax_code: 'IVA21', unit_of_measure: 'PACK', display_price: '0,46 €/UD' },

    // Productos ecológicos
    { ean: '8410000000086', title: 'Pasta integral ecológica 500g', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '3,90 €/KILO' },
    { ean: '8410000000087', title: 'Arroz integral ecológico 1 Kg', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'KG', display_price: '2,85 €/KILO' },
    { ean: '8410000000088', title: 'Aceite oliva ecológico 500ml', base_price: 6.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '13,90 €/LITRO' },
    { ean: '8410000000089', title: 'Tomate triturado ecológico 400g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '4,63 €/KILO' },
    { ean: '8410000000090', title: 'Huevos ecológicos 6 UD', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'PACK', display_price: '0,58 €/UD' },

    // Productos gourmet
    { ean: '8410000000091', title: 'Jamón ibérico 5J lonchas 80g', base_price: 8.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '111,88 €/KILO' },
    { ean: '8410000000092', title: 'Queso cabrales DOP 200g', base_price: 6.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '34,25 €/KILO' },
    { ean: '8410000000093', title: 'Aceitunas Kalamata 200g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '17,25 €/KILO' },
    { ean: '8410000000094', title: 'Paté de foie gras 125g', base_price: 12.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '103,60 €/KILO' },
    { ean: '8410000000095', title: 'Trufa negra conserva 25g', base_price: 18.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '758,00 €/KILO' },

    // Productos sin gluten
    { ean: '8410000000096', title: 'Pan sin gluten 400g', base_price: 3.85, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '9,63 €/KILO' },
    { ean: '8410000000097', title: 'Pasta sin gluten 250g', base_price: 2.95, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '11,80 €/KILO' },
    { ean: '8410000000098', title: 'Galletas sin gluten 150g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '23,00 €/KILO' },
    { ean: '8410000000099', title: 'Harina sin gluten 500g', base_price: 4.25, tax_code: 'IVA4', unit_of_measure: 'UD', display_price: '8,50 €/KILO' },
    { ean: '8410000000100', title: 'Cerveza sin gluten pack 6', base_price: 4.95, tax_code: 'IVA21', unit_of_measure: 'PACK', display_price: '0,83 €/UD' }
  ];

  // Sync config
  const syncConfig = [
    { entity_name: 'users', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 },
    { entity_name: 'products', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 },
    { entity_name: 'stores', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 },
    { entity_name: 'delivery_centers', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 },
    { entity_name: 'purchase_orders', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 }
  ];

  // Insert data
  console.log('Seeding database...');

  // Insert taxes
  for (const tax of taxes) {
    execute('INSERT INTO taxes (code, name, tax_rate) VALUES (?, ?, ?)', [tax.code, tax.name, tax.tax_rate]);
  }

  // Insert delivery centers
  for (const center of deliveryCenters) {
    execute('INSERT INTO delivery_centers (code, name) VALUES (?, ?)', [center.code, center.name]);
  }

  // Insert stores
  for (const store of stores) {
    execute('INSERT INTO stores (code, name, responsible_email, delivery_center_code, is_active) VALUES (?, ?, ?, ?, ?)', 
      [store.code, store.name, store.responsible_email, store.delivery_center_code, 1]);
  }

  // Insert users
  for (const user of users) {
    execute('INSERT INTO users (email, store_id, name, password_hash, is_active) VALUES (?, ?, ?, ?, ?)', 
      [user.email, user.store_id, user.name, user.password_hash, 1]);
  }

  // Insert products
  for (const product of products) {
    execute('INSERT INTO products (ean, title, base_price, tax_code, unit_of_measure, display_price, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [product.ean, product.title, product.base_price, product.tax_code, product.unit_of_measure, product.display_price, 1]);
  }

  // Insert sync config
  for (const config of syncConfig) {
    execute('INSERT INTO sync_config (entity_name, last_request_timestamp, last_updated_timestamp) VALUES (?, ?, ?)', 
      [config.entity_name, config.last_request_timestamp, config.last_updated_timestamp]);
  }

  // Create 10+ sample purchase orders (multiple for Luis)
  const samplePurchaseOrders = [
    {
      purchase_order_id: generateUUID(),
      user_email: 'luis@esgranvia.es',
      store_id: 'ES001',
      status: 'uncommunicated',
      subtotal: 125.00,
      tax_total: 15.75,
      final_total: 140.75
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'luis@esgranvia.es',
      store_id: 'ES001',
      status: 'processing',
      subtotal: 89.50,
      tax_total: 10.25,
      final_total: 99.75
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'luis@esgranvia.es',
      store_id: 'ES001',
      status: 'completed',
      subtotal: 156.80,
      tax_total: 18.95,
      final_total: 175.75
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'luis@esgranvia.es',
      store_id: 'ES001',
      status: 'uncommunicated',
      subtotal: 67.40,
      tax_total: 8.10,
      final_total: 75.50
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'maria@central.es',
      store_id: 'ES002',
      status: 'processing',
      subtotal: 85.50,
      tax_total: 12.25,
      final_total: 97.75
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'carlos@bcnnorte.es',
      store_id: 'ES003',
      status: 'completed',
      subtotal: 234.80,
      tax_total: 28.15,
      final_total: 262.95
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'ana@valencia.es',
      store_id: 'ES004',
      status: 'uncommunicated',
      subtotal: 156.25,
      tax_total: 18.75,
      final_total: 175.00
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'pedro@sevilla.es',
      store_id: 'ES005',
      status: 'processing',
      subtotal: 198.40,
      tax_total: 23.80,
      final_total: 222.20
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'laura@gourmet.es',
      store_id: 'ES006',
      status: 'completed',
      subtotal: 345.60,
      tax_total: 41.47,
      final_total: 387.07
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'miguel@superfresh.es',
      store_id: 'ES007',
      status: 'uncommunicated',
      subtotal: 92.30,
      tax_total: 11.08,
      final_total: 103.38
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'sofia@despensa.es',
      store_id: 'ES008',
      status: 'processing',
      subtotal: 167.85,
      tax_total: 20.14,
      final_total: 187.99
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'javier@andalucia.es',
      store_id: 'ES009',
      status: 'completed',
      subtotal: 278.90,
      tax_total: 33.47,
      final_total: 312.37
    },
    {
      purchase_order_id: generateUUID(),
      user_email: 'elena@costablanca.es',
      store_id: 'ES010',
      status: 'uncommunicated',
      subtotal: 134.50,
      tax_total: 16.14,
      final_total: 150.64
    }
  ];

  for (const order of samplePurchaseOrders) {
    execute('INSERT INTO purchase_orders (purchase_order_id, user_email, store_id, created_at, status, subtotal, tax_total, final_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [order.purchase_order_id, order.user_email, order.store_id, new Date().toISOString(), order.status, order.subtotal, order.tax_total, order.final_total]);
    
    // Add some sample items for each purchase order
    const sampleItems = [
      { ean: '8410000000001', quantity: 2, base_price: 1.00, tax_rate: 0.04 },
      { ean: '8410000000006', quantity: 3, base_price: 0.89, tax_rate: 0.04 },
      { ean: '8410000000011', quantity: 1, base_price: 1.25, tax_rate: 0.04 }
    ];
    
    for (const item of sampleItems) {
      execute('INSERT INTO purchase_order_items (purchase_order_id, item_ean, quantity, base_price_at_order, tax_rate_at_order) VALUES (?, ?, ?, ?, ?)',
        [order.purchase_order_id, item.ean, item.quantity, item.base_price, item.tax_rate]);
    }
  }

  // Create 10 sample orders (final orders from processed purchase orders)
  const completedPurchaseOrders = samplePurchaseOrders.filter(po => po.status === 'completed');
  const sampleOrders = completedPurchaseOrders.concat(
    // Add additional orders to reach 10 total
    [
      {
        purchase_order_id: generateUUID(),
        user_email: 'luis@esgranvia.es',
        store_id: 'ES001',
        status: 'completed',
        subtotal: 89.30,
        tax_total: 10.72,
        final_total: 100.02
      },
      {
        purchase_order_id: generateUUID(),
        user_email: 'maria@central.es',
        store_id: 'ES002',
        status: 'completed',
        subtotal: 156.75,
        tax_total: 18.81,
        final_total: 175.56
      },
      {
        purchase_order_id: generateUUID(),
        user_email: 'carlos@bcnnorte.es',
        store_id: 'ES003',
        status: 'completed',
        subtotal: 203.40,
        tax_total: 24.41,
        final_total: 227.81
      },
      {
        purchase_order_id: generateUUID(),
        user_email: 'ana@valencia.es',
        store_id: 'ES004',
        status: 'completed',
        subtotal: 312.85,
        tax_total: 37.54,
        final_total: 350.39
      },
      {
        purchase_order_id: generateUUID(),
        user_email: 'pedro@sevilla.es',
        store_id: 'ES005',
        status: 'completed',
        subtotal: 178.20,
        tax_total: 21.38,
        final_total: 199.58
      },
      {
        purchase_order_id: generateUUID(),
        user_email: 'laura@gourmet.es',
        store_id: 'ES006',
        status: 'completed',
        subtotal: 267.90,
        tax_total: 32.15,
        final_total: 300.05
      },
      {
        purchase_order_id: generateUUID(),
        user_email: 'miguel@superfresh.es',
        store_id: 'ES007',
        status: 'completed',
        subtotal: 143.60,
        tax_total: 17.23,
        final_total: 160.83
      }
    ]
  ).slice(0, 10);

  for (let i = 0; i < sampleOrders.length; i++) {
    const order = sampleOrders[i];
    const orderId = generateUUID();
    const createdDate = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(); // Different dates
    
    execute('INSERT INTO orders (order_id, source_purchase_order_id, user_email, store_id, created_at, subtotal, tax_total, final_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [orderId, order.purchase_order_id, order.user_email, order.store_id, createdDate, order.subtotal, order.tax_total, order.final_total]);
  }

  console.log('Database seeded successfully with:');
  console.log('- 100 products');
  console.log('- 10 users');
  console.log('- 10 stores');
  console.log('- 5 delivery centers');
  console.log('- 10 purchase orders');
  console.log('- 10 orders');
  console.log('- Spanish IVA taxes');
  console.log('- Sync configuration');
}
