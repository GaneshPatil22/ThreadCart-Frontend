// src/config/api.ts

export const getStrapiBaseUrl = (): string => {
  // Read base URL from environment variables
  const base = import.meta.env.VITE_STRAPI_URL;

  if (!base) {
    console.warn("⚠️ No VITE_STRAPI_URL found in environment!");
    return "http://localhost:1337";
  }

  return base.endsWith("/") ? base.slice(0, -1) : base;
};

// Helper for API endpoints
export const api = {
  getProducts: () => `${getStrapiBaseUrl()}/api/products?populate=*`,
  getCategories: () => `${getStrapiBaseUrl()}/api/categories`,
  getProductById: (id: string | number) =>
    `${getStrapiBaseUrl()}/api/products/${id}?populate=*`,
};
