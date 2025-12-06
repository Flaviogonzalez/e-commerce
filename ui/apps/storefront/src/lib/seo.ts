interface SeoOptions {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  path?: string;
  type?: "website" | "article" | "product";
  product?: {
    price: string;
    currency: string;
    availability: "in_stock" | "out_of_stock" | "preorder";
    sku?: string;
    brand?: string;
  };
}

export function seo(options: SeoOptions) {
  const {
    title,
    description,
    keywords = [],
    image = "/og-image.png",
    url = "",
    path,
    type = "website",
    product,
  } = options;

  const canonicalUrl = path ? `${process.env.SITE_URL ?? "https://example.com"}${path}` : url;

  const meta = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords.join(", ") },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:type", content: type },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: "E-Commerce Store" },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    // Additional SEO
    { name: "robots", content: "index, follow" },
    { name: "googlebot", content: "index, follow" },
  ];

  if (product) {
    meta.push(
      { property: "product:price:amount", content: product.price },
      { property: "product:price:currency", content: product.currency },
      {
        property: "product:availability",
        content:
          product.availability === "in_stock"
            ? "in stock"
            : product.availability === "out_of_stock"
              ? "out of stock"
              : "preorder",
      }
    );
    if (product.sku) {
      meta.push({ property: "product:retailer_item_id", content: product.sku });
    }
    if (product.brand) {
      meta.push({ property: "product:brand", content: product.brand });
    }
  }

  return meta;
}

export function generateProductJsonLd(product: {
  name: string;
  description: string;
  image: string;
  sku: string;
  brand: string;
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
  url: string;
  rating?: {
    value: number;
    count: number;
  };
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: product.url,
      priceCurrency: product.currency,
      price: product.price,
      availability: `https://schema.org/${product.availability}`,
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.value,
        reviewCount: product.rating.count,
      },
    }),
  };

  return JSON.stringify(jsonLd);
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return JSON.stringify(jsonLd);
}

export function generateOrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-Commerce Store",
    url: process.env.SITE_URL ?? "https://example.com",
    logo: `${process.env.SITE_URL ?? "https://example.com"}/logo.png`,
    sameAs: [
      "https://twitter.com/example",
      "https://facebook.com/example",
      "https://instagram.com/example",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-800-000-0000",
      contactType: "customer service",
      availableLanguage: ["English", "Spanish"],
    },
  };

  return JSON.stringify(jsonLd);
}

// Alias for backward compatibility
export const createSEOMeta = seo;
