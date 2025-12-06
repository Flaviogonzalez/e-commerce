import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Label,
  Skeleton,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui";
import { createSEOMeta } from "~/lib/seo";
import { Heart, ShoppingCart, Star, Filter, Grid, List, SlidersHorizontal } from "lucide-react";

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
  category: string;
  inStock: boolean;
}

interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}

// Mock data
const mockProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Product ${i + 1}`,
  slug: `product-${i + 1}`,
  price: Math.round(Math.random() * 200 + 50),
  originalPrice: Math.random() > 0.5 ? Math.round(Math.random() * 100 + 250) : undefined,
  image: `/images/products/product-${(i % 4) + 1}.jpg`,
  rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
  reviewCount: Math.round(Math.random() * 300 + 10),
  badge: i === 0 ? "Best Seller" : i === 2 ? "New" : undefined,
  category: ["electronics", "clothing", "home", "sports"][i % 4] || "electronics",
  inStock: Math.random() > 0.1,
}));

const categories = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
];

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    category: (search.category as string) || undefined,
    search: (search.search as string) || undefined,
    sort: (search.sort as string) || undefined,
    minPrice: search.minPrice ? Number(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
    page: search.page ? Number(search.page) : undefined,
  }),
  head: () => ({
    meta: createSEOMeta({
      title: "All Products",
      description: "Browse our complete collection of products. Find electronics, clothing, home goods, and more.",
      path: "/products",
      type: "website",
    }),
  }),
  component: ProductsPage,
});

function ProductCard({ product, viewMode }: { product: Product; viewMode: "grid" | "list" }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  if (viewMode === "list") {
    return (
      <Card className="flex overflow-hidden">
        <div className="aspect-square w-48 shrink-0 overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                {product.badge && <Badge className="mb-2">{product.badge}</Badge>}
                <h3 className="font-medium">{product.name}</h3>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">${product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                  <Badge variant="secondary">-{discount}%</Badge>
                </>
              )}
            </div>
            <Button disabled={!product.inStock}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      {product.badge && (
        <Badge className="absolute left-3 top-3 z-10">{product.badge}</Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
      >
        <Heart className="h-4 w-4" />
      </Button>

      <Link to="/products/$slug" params={{ slug: product.slug }}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
          </div>
          <h3 className="mb-2 font-medium line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">${product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
                <Badge variant="secondary" className="text-xs">-{discount}%</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Link>

      <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-background p-4 transition-transform group-hover:translate-y-0">
        <Button className="w-full" size="sm" disabled={!product.inStock}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </Card>
  );
}

function FilterSidebar({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-medium">Price Range</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="w-24"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="w-24"
          />
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h3 className="mb-3 font-medium">Availability</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="in-stock" />
            <Label htmlFor="in-stock">In Stock</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="on-sale" />
            <Label htmlFor="on-sale">On Sale</Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h3 className="mb-3 font-medium">Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox id={`rating-${rating}`} />
              <Label htmlFor={`rating-${rating}`} className="flex items-center gap-1">
                {rating}+ <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsPage() {
  const { category, sort, search } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = React.useState(true);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");

  React.useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      let filtered = [...mockProducts];
      if (category && category !== "all") {
        filtered = filtered.filter((p) => p.category === category);
      }
      if (search) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      setProducts(filtered);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [category, sort, search]);

  const handleCategoryChange = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        category: value === "all" ? undefined : value,
      }),
    });
  };

  const handleSortChange = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, sort: value }),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <span>Products</span>
        {category && category !== "all" && (
          <>
            <span className="mx-2">/</span>
            <span className="capitalize">{category}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {category && category !== "all"
            ? categories.find((c) => c.value === category)?.label
            : "All Products"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {products.length} products found
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterSidebar
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      onMinPriceChange={setMinPrice}
                      onMaxPriceChange={setMaxPrice}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Category Select */}
              <Select value={category || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Select */}
              <Select value={sort || "newest"} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className={viewMode === "list" ? "flex" : ""}>
                  <Skeleton
                    className={viewMode === "list" ? "h-48 w-48" : "aspect-square"}
                  />
                  <CardContent className="p-4">
                    <Skeleton className="mb-2 h-4 w-20" />
                    <Skeleton className="mb-2 h-5 w-full" />
                    <Skeleton className="h-6 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No products found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  navigate({ search: {} })
                }
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
