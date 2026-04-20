export interface GlobalProduct {
  codigo_barras: string;
  nome_padrao: string;
  marca?: string;
  categoria?: string;
  validado: boolean;
}

// Simulando um banco de dados global/API
let globalDB: GlobalProduct[] = [
  {
    codigo_barras: '7891010101010',
    nome_padrao: 'COCA COLA LATA 350ML',
    categoria: 'Bebidas',
    validado: true
  },
  {
    codigo_barras: '7892020202020',
    nome_padrao: 'CERVEJA HEINEKEN LATA 350ML',
    categoria: 'Bebidas',
    validado: true
  }
];

export const globalProductsAPI = {
  async getByBarcode(barcode: string): Promise<GlobalProduct | null> {
    // 1. Primeiro tenta na nossa Base Global Simulada
    const p = globalDB.find(prod => prod.codigo_barras === barcode);
    if (p) return p;

    // 2. Se não achou na nossa base, tenta buscar na API Externa Real (Open Food Facts)
    // O Open Food Facts é um banco gratuito gigantesco de alimentos e bebidas.
    try {
      const response = await fetch(`https://br.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data && data.status === 1 && data.product) {
        const productName = data.product.product_name_pt || data.product.product_name || data.product.generic_name;
        
        if (productName) {
          const brand = data.product.brands ? data.product.brands.split(',')[0] : '';
          const finalName = brand ? `${productName} ${brand}` : productName;

          return {
            codigo_barras: barcode,
            nome_padrao: finalName.toUpperCase(),
            categoria: data.product.categories_tags ? data.product.categories_tags[0] : 'Extras',
            validado: true
          };
        }
      }
    } catch (error) {
      console.warn("Falha ao buscar na API externa:", error);
    }

    return null;
  },

  async saveNew(barcode: string, name: string): Promise<GlobalProduct> {
    const newProd: GlobalProduct = {
      codigo_barras: barcode,
      nome_padrao: name.toUpperCase().replace(/\s+/g, ' ').trim(),
      validado: false
    };
    globalDB.push(newProd);
    return newProd;
  }
};
