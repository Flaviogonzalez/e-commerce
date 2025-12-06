import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Separator,
  Badge,
  RadioGroup,
  RadioGroupItem,
} from "@repo/ui";
import { createSEOMeta } from "~/lib/seo";
import { useCart } from "~/lib/cart";
import { useAuth } from "~/lib/auth";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Truck,
  Shield,
  Check,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
}

type CheckoutStep = "cart" | "shipping" | "payment" | "review" | "confirmation";

const CHECKOUT_STORAGE_KEY = "checkout_state";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: createSEOMeta({
      title: "Checkout",
      description: "Complete your purchase securely.",
      path: "/checkout",
    }),
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, itemCount, total, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = React.useState<CheckoutStep>("cart");
  const [shipping, setShipping] = React.useState<ShippingInfo>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [shippingMethod, setShippingMethod] = React.useState("standard");
  const [payment, setPayment] = React.useState<PaymentInfo>({
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string | null>(null);

  // Load checkout state from storage
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        if (state.shipping) setShipping(state.shipping);
        if (state.shippingMethod) setShippingMethod(state.shippingMethod);
        if (state.step && state.step !== "confirmation") setStep(state.step);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save checkout state to storage
  React.useEffect(() => {
    if (step !== "confirmation") {
      sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({ shipping, shippingMethod, step })
      );
    }
  }, [shipping, shippingMethod, step]);

  const shippingCost = shippingMethod === "express" ? 14.99 : shippingMethod === "priority" ? 9.99 : 0;
  const tax = total * 0.08;
  const grandTotal = total + shippingCost + tax;

  const steps: { id: CheckoutStep; label: string }[] = [
    { id: "cart", label: "Cart" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
    { id: "review", label: "Review" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]!.id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]!.id);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    setOrderId(newOrderId);
    setStep("confirmation");
    clearCart();
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    setIsProcessing(false);
  };

  if (itemCount === 0 && step !== "confirmation") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add some items to your cart to proceed with checkout.
        </p>
        <Button asChild className="mt-4">
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  if (step === "confirmation") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold">Order Confirmed!</h1>
          <p className="mt-4 text-muted-foreground">
            Thank you for your purchase. Your order has been received and is being
            processed.
          </p>
          {orderId && (
            <p className="mt-4">
              Order Number: <strong>{orderId}</strong>
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            A confirmation email will be sent to {shipping.email}
          </p>
          <div className="mt-8 space-x-4">
            <Button asChild>
              <Link to="/account/orders">View Orders</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Steps */}
      <nav className="mb-8">
        <ol className="flex items-center justify-center">
          {steps.map((s, index) => (
            <li key={s.id} className="flex items-center">
              <button
                onClick={() => index < currentStepIndex && setStep(s.id)}
                disabled={index > currentStepIndex}
                className={`flex items-center gap-2 ${
                  index <= currentStepIndex
                    ? "text-primary"
                    : "text-muted-foreground"
                } ${index < currentStepIndex ? "cursor-pointer" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                    index < currentStepIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : index === currentStepIndex
                        ? "border-primary text-primary"
                        : "border-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-16 ${
                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {step === "cart" && (
            <Card>
              <CardHeader>
                <CardTitle>Shopping Cart</CardTitle>
                <CardDescription>{itemCount} items in your cart</CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant.name}: {item.variant.value}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleNext}>
                  Continue to Shipping
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === "shipping" && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>Where should we send your order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={shipping.firstName}
                      onChange={(e) =>
                        setShipping({ ...shipping, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={shipping.lastName}
                      onChange={(e) =>
                        setShipping({ ...shipping, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shipping.email}
                      onChange={(e) =>
                        setShipping({ ...shipping, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shipping.phone}
                      onChange={(e) =>
                        setShipping({ ...shipping, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={shipping.address}
                    onChange={(e) =>
                      setShipping({ ...shipping, address: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shipping.city}
                      onChange={(e) =>
                        setShipping({ ...shipping, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping({ ...shipping, state: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={shipping.zip}
                      onChange={(e) =>
                        setShipping({ ...shipping, zip: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <Label>Shipping Method</Label>
                  <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="standard" id="standard" />
                        <Label htmlFor="standard" className="cursor-pointer">
                          <p className="font-medium">Standard Shipping</p>
                          <p className="text-sm text-muted-foreground">5-7 business days</p>
                        </Label>
                      </div>
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="priority" id="priority" />
                        <Label htmlFor="priority" className="cursor-pointer">
                          <p className="font-medium">Priority Shipping</p>
                          <p className="text-sm text-muted-foreground">2-3 business days</p>
                        </Label>
                      </div>
                      <span className="font-medium">$9.99</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="express" id="express" />
                        <Label htmlFor="express" className="cursor-pointer">
                          <p className="font-medium">Express Shipping</p>
                          <p className="text-sm text-muted-foreground">1 business day</p>
                        </Label>
                      </div>
                      <span className="font-medium">$14.99</span>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Continue to Payment
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Enter your card details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Your payment information is encrypted and secure</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={payment.cardNumber}
                      onChange={(e) =>
                        setPayment({ ...payment, cardNumber: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardHolder">Cardholder Name</Label>
                  <Input
                    id="cardHolder"
                    placeholder="John Doe"
                    value={payment.cardHolder}
                    onChange={(e) =>
                      setPayment({ ...payment, cardHolder: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={payment.expiry}
                      onChange={(e) =>
                        setPayment({ ...payment, expiry: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      maxLength={4}
                      value={payment.cvv}
                      onChange={(e) =>
                        setPayment({ ...payment, cvv: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Review Order
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === "review" && (
            <Card>
              <CardHeader>
                <CardTitle>Order Review</CardTitle>
                <CardDescription>Please review your order before placing it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Shipping Address */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Shipping Address</h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep("shipping")}>
                      Edit
                    </Button>
                  </div>
                  <p className="text-muted-foreground">
                    {shipping.firstName} {shipping.lastName}
                    <br />
                    {shipping.address}
                    <br />
                    {shipping.city}, {shipping.state} {shipping.zip}
                  </p>
                </div>

                <Separator />

                {/* Shipping Method */}
                <div>
                  <h3 className="mb-2 font-medium">Shipping Method</h3>
                  <p className="text-muted-foreground">
                    {shippingMethod === "express"
                      ? "Express (1 day)"
                      : shippingMethod === "priority"
                        ? "Priority (2-3 days)"
                        : "Standard (5-7 days)"}
                  </p>
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Payment Method</h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep("payment")}>
                      Edit
                    </Button>
                  </div>
                  <p className="text-muted-foreground">
                    Card ending in {payment.cardNumber.slice(-4)}
                  </p>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h3 className="mb-4 font-medium">Order Items</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handlePlaceOrder} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    `Place Order • $${grandTotal.toFixed(2)}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>

              {/* Promo Code */}
              <div className="pt-4">
                <Label htmlFor="promo">Promo Code</Label>
                <div className="mt-2 flex gap-2">
                  <Input id="promo" placeholder="Enter code" />
                  <Button variant="secondary">Apply</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure checkout</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
