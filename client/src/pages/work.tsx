import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Work, Passage } from "@shared/schema";

export default function WorkPage({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();

  const { data: work, isLoading: isLoadingWork } = useQuery<Work>({
    queryKey: [`/api/works/${params.id}`],
  });

  const { data: passages = [], isLoading: isLoadingPassages } = useQuery<Passage[]>({
    queryKey: [`/api/works/${params.id}/passages`],
  });

  if (isLoadingWork || isLoadingPassages) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }

  if (!work) {
    return <div className="container mx-auto p-6 text-center">Work not found</div>;
  }

  // Group passages by act and scene
  const passagesByAct = passages.reduce((acc, passage) => {
    if (passage.act === null) return acc;
    
    if (!acc[passage.act]) {
      acc[passage.act] = [];
    }
    acc[passage.act].push(passage);
    return acc;
  }, {} as Record<number, Passage[]>);

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
        <h1 className="text-4xl font-serif mb-2">{work.title}</h1>
        <p className="text-muted-foreground mb-8">{work.description}</p>

        <ScrollArea className="h-[calc(100vh-300px)]">
          {Object.entries(passagesByAct).map(([act, actPassages]) => (
            <div key={act} className="mb-8">
              <h2 className="text-2xl font-serif mb-4">Act {act}</h2>
              <div className="grid gap-4">
                {actPassages.map((passage) => (
                  <Card
                    key={passage.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate(`/passage/${passage.id}`)}
                  >
                    <CardHeader>
                      <CardTitle>Scene {passage.scene}</CardTitle>
                      <CardDescription>{passage.title}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
