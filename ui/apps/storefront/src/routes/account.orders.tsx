import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { useAuth } from "~/lib/auth";

export const Route = createFileRoute("/account/orders")({
  component: OrdersPage,
});

interface Order {
  id: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: number;
}

const mockOrders: Order[] = [
  {
    id: "ORD-123456",
    date: "2024-01-20",
    status: "delivered",
    total: 159.99,
    items: 3,
  },
  {
    id: "ORD-123457",
    date: "2024-01-18",
    status: "shipped",
    total: 89.5,
    items: 2,
  },
  {
    id: "ORD-123458",
    date: "2024-01-15",
    status: "processing",
    total: 245.0,
    items: 5,
  },
  {
    id: "ORD-123459",
    date: "2024-01-10",
    status: "delivered",
    total: 59.99,
    items: 1,
  },
  {
    id: "ORD-123460",
    date: "2024-01-05",
    status: "cancelled",
    total: 199.99,
    items: 4,
  },
];

const statusVariant: Record<Order["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  processing: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

function OrdersPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your orders.
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

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground">
              View and track your order history
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/account">Back to Account</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search orders..."
                className="max-w-sm"
              />
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="newest">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Total</SelectItem>
                    <SelectItem value="lowest">Lowest Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {mockOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{order.id}</p>
                      <Badge variant={statusVariant[order.status]}>
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed on{" "}
                      {new Date(order.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items} {order.items === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/account/orders/$orderId" params={{ orderId: order.id }}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
                {order.status === "shipped" && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          Tracking Number
                        </p>
                        <p className="font-mono">1Z999AA10123456784</p>
                      </div>
                      <Button variant="link" className="p-0 h-auto">
                        Track Package
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-muted-foreground">
            Showing {mockOrders.length} orders
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
