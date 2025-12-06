import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "~/components/home/hero-section";
import { FeaturedProducts } from "~/components/home/featured-products";
import { CategoryGrid } from "~/components/home/category-grid";
import { NewsletterSignup } from "~/components/home/newsletter-signup";
import { StorefrontLayout } from "~/components/layout/storefront-layout";
import { seo } from "~/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: seo({
      title: "E-Commerce Store - Premium Products",
      description: "Discover premium products at great prices. Shop electronics, clothing, home goods and more.",
      keywords: ["e-commerce", "online shopping", "premium products"],
    }),
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <StorefrontLayout>
      <main id="main-content" className="flex-1">
        <HeroSection />
        <FeaturedProducts />
        <CategoryGrid />
        <NewsletterSignup />
      </main>
    </StorefrontLayout>
  );
}
