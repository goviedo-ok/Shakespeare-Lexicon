import { useQuery } from "@tanstack/react-query";
import { TextDisplay } from "@/components/shakespeare/text-display";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Passage } from "@shared/schema";

export default function Home() {
  const { data: passages, isLoading } = useQuery<Passage[]>({
    queryKey: ["/api/passages"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground">Loading passages...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!passages) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground">No passages found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-serif text-center mb-8">Shakespeare Reader</h1>
      <p className="text-center text-muted-foreground mb-8">
        Click any word to see its definition
      </p>

      <Tabs defaultValue={passages[0].id.toString()} className="max-w-3xl mx-auto">
        <TabsList className="w-full">
          {passages.map((passage) => (
            <TabsTrigger
              key={passage.id}
              value={passage.id.toString()}
              className="flex-1"
            >
              {passage.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="h-[calc(100vh-300px)] mt-6">
          {passages.map((passage) => (
            <TabsContent key={passage.id} value={passage.id.toString()}>
              <TextDisplay passage={passage} />
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
}