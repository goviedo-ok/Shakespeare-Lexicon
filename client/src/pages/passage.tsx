import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TextDisplay } from "@/components/shakespeare/text-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Passage, Work } from "@shared/schema";

export default function PassagePage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();

  const { data: passage, isLoading } = useQuery<Passage>({
    queryKey: [`/api/passages/${params.id}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground">Loading passage...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground">Passage not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        ← Back to Library
      </Button>
      
      <div className="max-w-3xl mx-auto">
        <TextDisplay passage={passage} />
      </div>
    </div>
  );
}
