import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@repo/ui";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

const categories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    image: "/images/categories/electronics.jpg",
    productCount: 156,
  },
  {
    id: "2",
    name: "Clothing",
    slug: "clothing",
    image: "/images/categories/clothing.jpg",
    productCount: 243,
  },
  {
    id: "3",
    name: "Home & Garden",
    slug: "home-garden",
    image: "/images/categories/home.jpg",
    productCount: 89,
  },
  {
    id: "4",
    name: "Sports",
    slug: "sports",
    image: "/images/categories/sports.jpg",
    productCount: 124,
  },
  {
    id: "5",
    name: "Books",
    slug: "books",
    image: "/images/categories/books.jpg",
    productCount: 312,
  },
  {
    id: "6",
    name: "Beauty",
    slug: "beauty",
    image: "/images/categories/beauty.jpg",
    productCount: 78,
  },
];

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link to="/products" search={{ category: category.slug }}>
      <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <CardContent className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <p className="text-sm text-white/80">
            {category.productCount} products
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CategoryGrid() {
  return (
    <section className="bg-muted/50 py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find exactly what you&apos;re looking for
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
