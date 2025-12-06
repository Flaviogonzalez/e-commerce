import * as React from "react";
import { Button, Input, Card, CardContent } from "@repo/ui";
import { Mail, CheckCircle2 } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus("loading");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate success
      setStatus("success");
      setMessage("Thanks for subscribing! Check your inbox for confirmation.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              {/* Image section */}
              <div className="hidden bg-primary/10 md:block">
                <div className="flex h-full flex-col items-center justify-center p-8">
                  <Mail className="h-16 w-16 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold">Stay Updated</h3>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Get the latest deals and exclusive offers
                  </p>
                </div>
              </div>

              {/* Form section */}
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Join Our Newsletter
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Subscribe for exclusive deals, early access to new arrivals, and
                    insider tips.
                  </p>
                </div>

                {status === "success" ? (
                  <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p className="text-sm">{message}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-label="Email address"
                        disabled={status === "loading"}
                      />
                      {status === "error" && (
                        <p className="text-sm text-destructive">{message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Subscribing...
                        </>
                      ) : (
                        "Subscribe"
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      By subscribing, you agree to our{" "}
                      <a href="/privacy" className="underline hover:text-foreground">
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a href="/terms" className="underline hover:text-foreground">
                        Terms of Service
                      </a>
                      .
                    </p>
                  </form>
                )}

                {/* Benefits */}
                <div className="mt-6 space-y-2 border-t pt-6">
                  <p className="text-sm font-medium">Subscriber benefits:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 10% off your first order</li>
                    <li>• Early access to sales</li>
                    <li>• Exclusive member-only deals</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
