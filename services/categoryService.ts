import { db } from "./db";

export interface Category {
    id: string; // Firebase keys are strings
    name: string;
    slug: string;
}

export const INITIAL_CATEGORIES: Category[] = [
    { id: "cat_1", name: "Yiyecekler", slug: "yiyecekler" },
    { id: "cat_2", name: "İçecekler", slug: "icecekler" },
    { id: "cat_3", name: "Sigara", slug: "sigara" },
];

export const fetchCategories = async (): Promise<Category[]> => {
    const data = await db.get("/categories");

    if (!data) {
        // Initialize with defaults if empty
        await db.put("/categories", INITIAL_CATEGORIES);
        return INITIAL_CATEGORIES;
    }

    // If data is array
    if (Array.isArray(data)) return data.filter(Boolean);

    // If data is object (Firebase formatted), convert to array
    return Object.values(data);
};

export const addCategory = async (name: string) => {
    const categories = await fetchCategories();
    const newCategory: Category = {
        id: `cat_${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
    };

    // We rewrite the array for simplicity (small data)
    await db.put("/categories", [...categories, newCategory]);
    return newCategory;
};

export const deleteCategory = async (id: string) => {
    const categories = await fetchCategories();
    const filtered = categories.filter(c => c.id !== id);
    await db.put("/categories", filtered);
};
