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
    { ean: '8410000000001', title: 'Azúcar blanco Día paquete 1 Kg', base_price: 1.00, tax_code: 'IVA4', unit_of_measure: 'KG', quantity_measure: 1.0 },
    { ean: '8410000000002', title: 'Azúcar moreno integral 500g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000003', title: 'Edulcorante líquido stevia 90ml', base_price: 3.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.09 },
    { ean: '8410000000004', title: 'Miel pura de flores 500g', base_price: 4.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000005', title: 'Azúcar glas para repostería 250g', base_price: 1.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.25 },

    // Aceites y Vinagres  
    { ean: '8410000000006', title: 'Aceite de oliva virgen extra Carbonell 1L', base_price: 4.85, tax_code: 'IVA4', unit_of_measure: 'L', quantity_measure: 1.0 },
    { ean: '8410000000007', title: 'Aceite de girasol Coosur 1L', base_price: 2.15, tax_code: 'IVA4', unit_of_measure: 'L', quantity_measure: 1.0 },
    { ean: '8410000000008', title: 'Vinagre de Jerez DO 250ml', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.25 },
    { ean: '8410000000009', title: 'Aceite de oliva 0,4º Hojiblanca 500ml', base_price: 3.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000010', title: 'Vinagre de manzana ecológico 500ml', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },

    // Harinas y Levaduras
    { ean: '8410000000011', title: 'Harina de trigo panadera 1 Kg', base_price: 0.95, tax_code: 'IVA4', unit_of_measure: 'KG', quantity_measure: 1.0 },
    { ean: '8410000000012', title: 'Levadura fresca prensada 25g', base_price: 0.35, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.025 },
    { ean: '8410000000013', title: 'Harina integral de espelta 500g', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000014', title: 'Levadura química Royal sobre 16g', base_price: 0.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.016 },
    { ean: '8410000000015', title: 'Harina de avena sin gluten 400g', base_price: 3.15, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.4 },

    // Especias y Condimentos
    { ean: '8410000000016', title: 'Sal marina fina 1 Kg', base_price: 0.65, tax_code: 'IVA4', unit_of_measure: 'KG', quantity_measure: 1.0 },
    { ean: '8410000000017', title: 'Pimienta negra molida 50g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.05 },
    { ean: '8410000000018', title: 'Pimentón dulce de La Vera 75g', base_price: 2.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.075 },
    { ean: '8410000000019', title: 'Orégano seco especias 20g', base_price: 1.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.02 },
    { ean: '8410000000020', title: 'Ajo en polvo especias 60g', base_price: 1.65, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.06 },

    // Pasta y Arroces
    { ean: '8410000000021', title: 'Espaguetis nº3 Gallo 500g', base_price: 1.15, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000022', title: 'Arroz bomba Calasparra DOP 500g', base_price: 3.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000023', title: 'Macarrones Barilla 500g', base_price: 1.35, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000024', title: 'Arroz largo La Fallera 1 Kg', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'KG', quantity_measure: 1.0 },
    { ean: '8410000000025', title: 'Fideuá nº2 Gallo 500g', base_price: 1.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },

    // Conservas y Encurtidos
    { ean: '8410000000026', title: 'Tomate triturado Orlando 400g', base_price: 0.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.4 },
    { ean: '8410000000027', title: 'Atún en aceite Ortiz 80g', base_price: 2.15, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.08 },
    { ean: '8410000000028', title: 'Aceitunas rellenas anchoa 150g', base_price: 1.65, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.15 },
    { ean: '8410000000029', title: 'Pimientos del piquillo Lodosa 185g', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.185 },
    { ean: '8410000000030', title: 'Sardinas en aceite 120g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.12 },

    // Legumbres secas
    { ean: '8410000000031', title: 'Garbanzos pedrosillanos 500g', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000032', title: 'Lentejas castellanas 500g', base_price: 1.75, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000033', title: 'Alubias blancas riñón 500g', base_price: 2.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000034', title: 'Guisantes secos partidos 500g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000035', title: 'Soja texturizada fina 150g', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.15 },

    // Frutos secos
    { ean: '8410000000036', title: 'Almendras crudas 200g', base_price: 3.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.2 },
    { ean: '8410000000037', title: 'Nueces con cáscara 500g', base_price: 2.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000038', title: 'Pistachos tostados con sal 100g', base_price: 4.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.1 },
    { ean: '8410000000039', title: 'Cacahuetes tostados 150g', base_price: 1.65, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.15 },
    { ean: '8410000000040', title: 'Avellanas tostadas 200g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.2 },

    // Lácteos y Huevos
    { ean: '8410000000041', title: 'Leche entera Central Lechera 1L', base_price: 1.05, tax_code: 'IVA4', unit_of_measure: 'L', quantity_measure: 1.0 },
    { ean: '8410000000042', title: 'Yogur natural Danone pack 4', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'PACK', quantity_measure: 1 },
    { ean: '8410000000043', title: 'Queso manchego curado 250g', base_price: 6.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.25 },
    { ean: '8410000000044', title: 'Huevos frescos categoría M docena', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'DOCENA', quantity_measure: 1 },
    { ean: '8410000000045', title: 'Mantequilla sin sal 250g', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.25 },

    // Cárnicos y Embutidos
    { ean: '8410000000046', title: 'Jamón serrano reserva lonchas 100g', base_price: 4.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.1 },
    { ean: '8410000000047', title: 'Chorizo ibérico extra dulce 200g', base_price: 5.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.2 },
    { ean: '8410000000048', title: 'Lomo embuchado ibérico lonchas 80g', base_price: 3.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.08 },
    { ean: '8410000000049', title: 'Salchichón extra lonchas 100g', base_price: 3.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.1 },
    { ean: '8410000000050', title: 'Morcilla de Burgos 200g', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.2 },

    // Pan y Bollería
    { ean: '8410000000051', title: 'Pan de molde integral Bimbo 680g', base_price: 1.75, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.68 },
    { ean: '8410000000052', title: 'Tostadas artesanas pack 30', base_price: 2.15, tax_code: 'IVA4', unit_of_measure: 'PACK', quantity_measure: 1 },
    { ean: '8410000000053', title: 'Magdalenas caseras pack 12', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'PACK', quantity_measure: 1 },
    { ean: '8410000000054', title: 'Galletas María Fontaneda 800g', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.8 },
    { ean: '8410000000055', title: 'Croissants mantequilla pack 6', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'PACK', quantity_measure: 1 },

    // Bebidas no alcohólicas
    { ean: '8410000000056', title: 'Agua mineral Bezoya 1.5L', base_price: 0.65, tax_code: 'IVA4', unit_of_measure: 'L', quantity_measure: 1.5 },
    { ean: '8410000000057', title: 'Zumo de naranja Don Simón 1L', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'L', quantity_measure: 1.0 },
    { ean: '8410000000058', title: 'Refresco cola Coca-Cola 2L', base_price: 2.15, tax_code: 'IVA21', unit_of_measure: 'L', quantity_measure: 2.0 },
    { ean: '8410000000059', title: 'Té verde Hornimans 25 bolsitas', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'PACK', quantity_measure: 25 },
    { ean: '8410000000060', title: 'Café molido natural Marcilla 250g', base_price: 3.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.25 },

    // Congelados
    { ean: '8410000000061', title: 'Verduras menestra Findus 400g', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.4 },
    { ean: '8410000000062', title: 'Pescadilla sin espinas 500g', base_price: 4.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5 },
    { ean: '8410000000063', title: 'Pizza 4 quesos Buitoni 365g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.365 },
    { ean: '8410000000064', title: 'Helado de vainilla 1L', base_price: 3.85, tax_code: 'IVA4', unit_of_measure: 'L', quantity_measure: 1.0 },
    { ean: '8410000000065', title: 'Patatas fritas McCain 750g', base_price: 2.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.75 },

    // Limpieza personal
    { ean: '8410000000066', title: 'Champú anticaspa H&S 360ml', base_price: 4.25, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.36 },
    { ean: '8410000000067', title: 'Pasta de dientes Signal 75ml', base_price: 1.85, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.075 },
    { ean: '8410000000068', title: 'Gel de ducha Nivea 600ml', base_price: 2.95, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.6 },
    { ean: '8410000000069', title: 'Desodorante spray Rexona 150ml', base_price: 2.45, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.15 },
    { ean: '8410000000070', title: 'Papel higiénico Scottex pack 12', base_price: 6.85, tax_code: 'IVA21', unit_of_measure: 'PACK', quantity_measure: 1 },

    // Limpieza del hogar
    { ean: '8410000000071', title: 'Detergente líquido Ariel 27 dosis', base_price: 5.95, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 1 },
    { ean: '8410000000072', title: 'Lavavajillas Fairy limón 650ml', base_price: 2.15, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.65 },
    { ean: '8410000000073', title: 'Cacao en polvo 400g', base_price: 3.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.4},
    { ean: '8410000000074', title: 'Manzanilla bolsitas pack 20', base_price: 1.65, tax_code: 'IVA4', unit_of_measure: 'PACK', quantity_measure: 20},
    { ean: '8410000000075', title: 'Café soluble 100g', base_price: 4.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.1},

    // Productos infantiles
    { ean: '8410000000076', title: 'Potito verduras y pollo 250g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.25},
    { ean: '8410000000077', title: 'Cereales bebé sin gluten 400g', base_price: 3.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.4},
    { ean: '8410000000078', title: 'Zumo manzana bebé 330ml', base_price: 1.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.33},
    { ean: '8410000000079', title: 'Galletas bebé 180g', base_price: 2.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.18},
    { ean: '8410000000080', title: 'Papilla 8 cereales 600g', base_price: 4.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.6},

    // Dulces y aperitivos
    { ean: '8410000000081', title: 'Chocolate con leche 125g', base_price: 1.95, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.125},
    { ean: '8410000000082', title: 'Patatas fritas bolsa 160g', base_price: 1.45, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.16},
    { ean: '8410000000083', title: 'Caramelos surtidos 150g', base_price: 1.25, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.15},
    { ean: '8410000000084', title: 'Frutos secos salados 200g', base_price: 2.95, tax_code: 'IVA21', unit_of_measure: 'UD', quantity_measure: 0.2},
    { ean: '8410000000085', title: 'Chicles sin azúcar pack 4', base_price: 1.85, tax_code: 'IVA21', unit_of_measure: 'PACK', quantity_measure: 4},

    // Productos ecológicos
    { ean: '8410000000086', title: 'Pasta integral ecológica 500g', base_price: 1.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5},
    { ean: '8410000000087', title: 'Arroz integral ecológico 1 Kg', base_price: 2.85, tax_code: 'IVA4', unit_of_measure: 'KG', quantity_measure: 1},
    { ean: '8410000000088', title: 'Aceite oliva ecológico 500ml', base_price: 6.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5},
    { ean: '8410000000089', title: 'Tomate triturado ecológico 400g', base_price: 1.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.4},
    { ean: '8410000000090', title: 'Huevos ecológicos 6 UD', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'PACK', quantity_measure: 1},

    // Productos gourmet
    { ean: '8410000000091', title: 'Jamón ibérico 5J lonchas 80g', base_price: 8.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.08},
    { ean: '8410000000092', title: 'Queso cabrales DOP 200g', base_price: 6.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.2},
    { ean: '8410000000093', title: 'Aceitunas Kalamata 200g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.2},
    { ean: '8410000000094', title: 'Paté de foie gras 125g', base_price: 12.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.125},
    { ean: '8410000000095', title: 'Trufa negra conserva 25g', base_price: 18.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.025},

    // Productos sin gluten
    { ean: '8410000000096', title: 'Pan sin gluten 400g', base_price: 3.85, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.4},
    { ean: '8410000000097', title: 'Pasta sin gluten 250g', base_price: 2.95, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.25},
    { ean: '8410000000098', title: 'Galletas sin gluten 150g', base_price: 3.45, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.15},
    { ean: '8410000000099', title: 'Harina sin gluten 500g', base_price: 4.25, tax_code: 'IVA4', unit_of_measure: 'UD', quantity_measure: 0.5},
    { ean: '8410000000100', title: 'Cerveza sin gluten pack 6', base_price: 4.95, tax_code: 'IVA21', unit_of_measure: 'PACK', quantity_measure: 1}
  ];

  // Sync config
  const syncConfig = [
    { entity_name: 'users', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 },
    { entity_name: 'products', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 },
    { entity_name: 'taxes', last_request_timestamp: Date.now() - 86400000, last_updated_timestamp: Date.now() - 86400000 },
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
    execute('INSERT INTO products (ean, title, base_price, tax_code, unit_of_measure, quantity_measure, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [product.ean, product.title, product.base_price, product.tax_code, product.unit_of_measure, product.quantity_measure || 1.0, 1]);
  }

  // Insert sync config
  for (const config of syncConfig) {
    execute('INSERT INTO sync_config (entity_name, last_request_timestamp, last_updated_timestamp) VALUES (?, ?, ?)', 
      [config.entity_name, config.last_request_timestamp, config.last_updated_timestamp]);
  }

  console.log('Database seeded successfully with:');
  console.log('- 100 products');
  console.log('- 10 users');
  console.log('- 10 stores');
  console.log('- 5 delivery centers');
  console.log('- Spanish IVA taxes');
  console.log('- Sync configuration');
}