import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Brain, Zap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-2xl">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center border">
              <Brain className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Spasial AI Platform
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-muted-foreground leading-7">
          Advanced spatial intelligence for your data
        </p>

        {/* Features */}
        <div className="flex justify-center space-x-8 py-6">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">Fast Analysis</span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Brain className="w-5 h-5" />
            <span className="text-sm font-medium">AI Powered</span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium">Spatial Intelligence</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Button asChild size="lg" className="px-8 py-3 text-xs">
            <Link to="/chat">
              Start Your Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
