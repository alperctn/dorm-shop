
export interface Product {
    id: number;
    name: string;
    price: number;
    costPrice?: number; // Alış Fiyatı
    stock: number;
    category: string;
    description?: string;
    emoji?: string;
    imageUrl?: string;
    isVisible?: boolean; // New field for hiding products
}

export const INITIAL_PRODUCTS: Product[] = [
    { id: 4, name: "Ice Tea Şeftali", price: 25, stock: 0, category: "icecekler", emoji: "🍑" },
    { id: 5, name: "Lays Klasik", price: 30, stock: 15, category: "yiyecekler", emoji: "🥔" },
    { id: 6, name: "Lays Baharatlı", price: 30, stock: 12, category: "yiyecekler", emoji: "🌶️" },
    { id: 7, name: "Ruffles", price: 30, stock: 2, category: "yiyecekler", emoji: "🍟" },
    { id: 8, name: "Doritos", price: 30, stock: 5, category: "yiyecekler", emoji: "🧀" },
    { id: 9, name: "Çubuk Kraker", price: 10, stock: 20, category: "yiyecekler", emoji: "🥖" },
    { id: 10, name: "Marlboro Touch", price: 70, stock: 3, category: "sigara", emoji: "🚬" },
    { id: 11, name: "Parliament Night", price: 75, stock: 12, category: "sigara", emoji: "🚬" },
    { id: 12, name: "Winston Slender", price: 65, stock: 0, category: "sigara", emoji: "🚬" },
];

export const fetchProducts = async (): Promise<Product[]> => {
    // 1. Veritabanından çek
    // const data = await db.get("/products"); // OLD
    const res = await fetch("/api/products", { cache: "no-store" });
    if (!res.ok) return INITIAL_PRODUCTS;
    const data = await res.json();

    // 2. Eğer veri yoksa (ilk açılış), varsayılanları yükle
    if (!data || data.length === 0) {
        // Initial POST to populate
        await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(INITIAL_PRODUCTS),
        });
        return INITIAL_PRODUCTS;
    }

    return data;
};

export const saveProducts = async (products: Product[]) => {
    // await db.put("/products", products); // OLD
    await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products),
    });

    // Diğer sekmeleri uyarmak için event
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("product-storage"));
    }
};

export const resetProducts = async () => {
    await saveProducts(INITIAL_PRODUCTS);
};

export const updateProductStock = async (id: number, quantityToDeduct: number) => {
    // Client-side stock update is no longer needed/safe for single actions.
    // We will rely on the server-side order processing which handles stock deduction atomically.
    // However, if we need to manually update stock from admin panel, saveProducts usage is fine.
    // For single item update, we can still use this helpers logic but route via saveProducts API.

    // This function might be deprecated for "Order" flow, but useful for "Admin" manual adjustment.

    const products = await fetchProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newStock = product.stock - quantityToDeduct;
    const updatedProducts = products.map(p =>
        p.id === id ? { ...p, stock: newStock } : p
    );
    await saveProducts(updatedProducts);
};
