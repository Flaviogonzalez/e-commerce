import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from "@repo/ui";
import { Heart, ShoppingCart, Star } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  badge?: string;
}

// Mock data - replace with API call
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    price: 199.99,
    originalPrice: 249.99,
    image: "/images/products/headphones.jpg",
    rating: 4.8,
    reviewCount: 124,
    badge: "Best Seller",
  },
  {
    id: "2",
    name: "Minimalist Watch",
    slug: "minimalist-watch",
    price: 149.99,
    image: "/images/products/watch.jpg",
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: "3",
    name: "Leather Messenger Bag",
    slug: "leather-messenger-bag",
    price: 89.99,
    originalPrice: 119.99,
    image: "/images/products/bag.jpg",
    rating: 4.9,
    reviewCount: 256,
    badge: "New",
  },
  {
    id: "4",
    name: "Smart Fitness Tracker",
    slug: "smart-fitness-tracker",
    price: 79.99,
    image: "/images/products/tracker.jpg",
    rating: 4.5,
    reviewCount: 312,
  },
];

function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      {/* Badge */}
      {product.badge && (
        <Badge className="absolute left-3 top-3 z-10">
          {product.badge}
        </Badge>
      )}

      {/* Wishlist button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
        aria-label="Add to wishlist"
      >
        <Heart className="h-4 w-4" />
      </Button>

      <Link to="/products/$slug" params={{ slug: product.slug }}>
        {/* Image */}
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <CardContent className="p-4">
          {/* Rating */}
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>

          {/* Name */}
          <h3 className="mb-2 font-medium line-clamp-2">{product.name}</h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  -{discount}%
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Link>

      {/* Quick add button */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-background p-4 transition-transform group-hover:translate-y-0">
        <Button className="w-full" size="sm">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square" />
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="mb-2 h-5 w-full" />
        <Skeleton className="h-6 w-24" />
      </CardContent>
    </Card>
  );
}

export function FeaturedProducts() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setProducts(mockProducts);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Featured Products
            </h2>
            <p className="mt-2 text-muted-foreground">
              Discover our most popular items
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/products">View All</Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}
