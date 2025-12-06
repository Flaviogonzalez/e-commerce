import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Button,
  Badge,
  Card,
  CardContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
} from "@repo/ui";
import { createSEOMeta, generateProductJsonLd, generateBreadcrumbJsonLd } from "~/lib/seo";
import { useCart } from "~/lib/cart";
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  available: boolean;
}

interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

interface ProductReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  rating: number;
  reviewCount: number;
  category: { name: string; slug: string };
  variants: {
    colors: ProductVariant[];
    sizes: ProductVariant[];
  };
  features: string[];
  specifications: Record<string, string>;
  reviews: ProductReview[];
  inStock: boolean;
  stockCount: number;
}

// Mock product data
const mockProduct: ProductDetail = {
  id: "1",
  name: "Premium Wireless Headphones",
  slug: "premium-wireless-headphones",
  description:
    "Experience audio like never before with our Premium Wireless Headphones. Featuring advanced noise cancellation, 40-hour battery life, and ultra-comfortable memory foam ear cushions. Perfect for music lovers, commuters, and remote workers who demand the best sound quality.",
  price: 199.99,
  originalPrice: 249.99,
  images: [
    { id: "1", src: "/images/products/headphones-1.jpg", alt: "Premium Wireless Headphones - Front view" },
    { id: "2", src: "/images/products/headphones-2.jpg", alt: "Premium Wireless Headphones - Side view" },
    { id: "3", src: "/images/products/headphones-3.jpg", alt: "Premium Wireless Headphones - Detail" },
    { id: "4", src: "/images/products/headphones-4.jpg", alt: "Premium Wireless Headphones - In use" },
  ],
  rating: 4.8,
  reviewCount: 124,
  category: { name: "Electronics", slug: "electronics" },
  variants: {
    colors: [
      { id: "black", name: "Color", value: "Black", available: true },
      { id: "white", name: "Color", value: "White", available: true },
      { id: "silver", name: "Color", value: "Silver", available: false },
    ],
    sizes: [],
  },
  features: [
    "Active Noise Cancellation",
    "40-hour battery life",
    "Bluetooth 5.2",
    "Hi-Res Audio certified",
    "Memory foam ear cushions",
    "Foldable design",
    "Touch controls",
    "Multi-device pairing",
  ],
  specifications: {
    "Driver Size": "40mm",
    "Frequency Response": "20Hz - 40kHz",
    "Impedance": "32 Ohm",
    "Battery": "Lithium-ion 800mAh",
    "Charging Time": "2 hours",
    Weight: "250g",
    Connectivity: "Bluetooth 5.2, 3.5mm aux",
  },
  reviews: [
    {
      id: "1",
      author: "John D.",
      avatar: "/images/avatars/avatar-1.jpg",
      rating: 5,
      date: "2024-01-15",
      content: "Best headphones I've ever owned. The noise cancellation is incredible and the battery life is exactly as advertised. Highly recommend!",
      helpful: 42,
    },
    {
      id: "2",
      author: "Sarah M.",
      avatar: "/images/avatars/avatar-2.jpg",
      rating: 4,
      date: "2024-01-10",
      content: "Great sound quality and comfortable for long listening sessions. Only minor complaint is the touch controls can be a bit finicky sometimes.",
      helpful: 28,
    },
  ],
  inStock: true,
  stockCount: 15,
};

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: createSEOMeta({
      title: mockProduct.name,
      description: mockProduct.description.slice(0, 160),
      path: `/products/${params.slug}`,
      type: "product",
      image: mockProduct.images[0]?.src,
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          generateProductJsonLd({
            name: mockProduct.name,
            description: mockProduct.description,
            image: mockProduct.images[0]?.src || "",
            price: mockProduct.price,
            currency: "USD",
            availability: mockProduct.inStock ? "InStock" : "OutOfStock",
            rating: { value: mockProduct.rating, count: mockProduct.reviewCount },
            brand: "E-Commerce Store",
            sku: mockProduct.id,
            url: `/products/${params.slug}`,
          })
        ),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          generateBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: mockProduct.category.name, url: `/products?category=${mockProduct.category.slug}` },
            { name: mockProduct.name, url: `/products/${params.slug}` },
          ])
        ),
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const [isLoading, setIsLoading] = React.useState(true);
  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setProduct(mockProduct);
      setSelectedColor(mockProduct.variants.colors[0]?.id || "");
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const selectedVariant = product.variants.colors.find((c) => c.id === selectedColor);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0]?.src || "",
      variant: selectedVariant
        ? { id: selectedVariant.id, name: selectedVariant.name, value: selectedVariant.value }
        : undefined,
    });
  };

  const discount = product?.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="mt-2 text-muted-foreground">The product you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-foreground">Products</Link>
        <span className="mx-2">/</span>
        <Link
          to="/products"
          search={{ category: product.category.slug }}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.images[selectedImage]?.src}
              alt={product.images[selectedImage]?.alt}
              className="h-full w-full object-cover"
            />
            {discount && (
              <Badge className="absolute left-4 top-4">-{discount}%</Badge>
            )}
            {/* Navigation arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              onClick={() =>
                setSelectedImage((prev) =>
                  prev === 0 ? product.images.length - 1 : prev - 1
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              onClick={() =>
                setSelectedImage((prev) =>
                  prev === product.images.length - 1 ? 0 : prev + 1
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-md ${
                  selectedImage === index ? "ring-2 ring-primary" : ""
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium">{product.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">${product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
                <Badge variant="destructive">Save ${(product.originalPrice - product.price).toFixed(2)}</Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          {/* Color Selection */}
          {product.variants.colors.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {product.variants.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => color.available && setSelectedColor(color.id)}
                    disabled={!color.available}
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      selectedColor === color.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary"
                    } ${!color.available ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {color.value}
                    {!color.available && " (Out of Stock)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="mb-2 block text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
                disabled={quantity >= product.stockCount}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {product.stockCount} available
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <Truck className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Shield className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs">2 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <RotateCcw className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs">30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="features" className="mt-12">
        <TabsList>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b py-2">
                <span className="font-medium">{key}</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="h-10 w-10 rounded-full bg-muted"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{review.author}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-muted-foreground">{review.content}</p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        Helpful ({review.helpful})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
