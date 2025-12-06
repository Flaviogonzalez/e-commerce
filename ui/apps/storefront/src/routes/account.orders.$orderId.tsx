import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Separator } from "@repo/ui/separator";
import { useAuth } from "~/lib/auth";
import { useCart } from "~/lib/cart";

export const Route = createFileRoute("/account/orders/$orderId")({
  component: OrderDetailPage,
});

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

interface OrderDetail {
  id: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4: string;
  };
  trackingNumber?: string;
}

const mockOrder: OrderDetail = {
  id: "ORD-123456",
  date: "2024-01-20",
  status: "shipped",
  items: [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      price: 79.99,
      quantity: 1,
      image: "/products/headphones.jpg",
      variant: "Black",
    },
    {
      id: "2",
      name: "USB-C Charging Cable",
      price: 19.99,
      quantity: 2,
      image: "/products/cable.jpg",
    },
    {
      id: "3",
      name: "Portable Power Bank",
      price: 39.99,
      quantity: 1,
      image: "/products/powerbank.jpg",
    },
  ],
  subtotal: 159.96,
  shipping: 0,
  tax: 12.8,
  total: 172.76,
  shippingAddress: {
    name: "John Doe",
    street: "123 Main Street, Apt 4B",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "United States",
  },
  paymentMethod: {
    type: "Visa",
    last4: "4242",
  },
  trackingNumber: "1Z999AA10123456784",
};

const statusSteps = ["pending", "processing", "shipped", "delivered"] as const;

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [reordering, setReordering] = useState(false);

  const order = mockOrder;

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view order details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentStep = statusSteps.indexOf(
    order.status as (typeof statusSteps)[number]
  );

  const handleReorder = () => {
    setReordering(true);
    order.items.forEach((item) => {
      addItem({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variant: item.variant ? { id: item.id, name: "Option", value: item.variant } : undefined,
      });
    });
    setReordering(false);
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{order.id}</h1>
              <Badge
                variant={
                  order.status === "cancelled"
                    ? "destructive"
                    : order.status === "delivered"
                      ? "default"
                      : "secondary"
                }
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Placed on{" "}
              {new Date(order.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/account/orders">Back to Orders</Link>
            </Button>
            <Button onClick={handleReorder} disabled={reordering}>
              Reorder
            </Button>
          </div>
        </div>

        {order.status !== "cancelled" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="flex justify-between mb-2">
                  {statusSteps.map((step, index) => (
                    <div
                      key={step}
                      className={`flex flex-col items-center ${
                        index <= currentStep
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index <= currentStep
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-xs mt-1 capitalize">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              {order.trackingNumber && order.status === "shipped" && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Tracking Number
                  </p>
                  <p className="font-mono font-medium">{order.trackingNumber}</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Track Package →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 rounded-md bg-muted overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {order.shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `$${order.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.street}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zip}
                  <br />
                  {order.shippingAddress.country}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {order.paymentMethod.type} ending in{" "}
                  <span className="font-mono">{order.paymentMethod.last4}</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <a href="/contact">Contact Support</a>
                </Button>
                {order.status === "delivered" && (
                  <Button variant="outline" className="w-full">
                    Request Return
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
