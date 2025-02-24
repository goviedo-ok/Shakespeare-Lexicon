import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import type { Work, Passage } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: works = [], isLoading } = useQuery<Work[]>({
    queryKey: [searchQuery ? `/api/search?q=${searchQuery}` : "/api/works"],
  });

  const plays = works.filter(w => w.type === "play");
  const sonnets = works.filter(w => w.type === "sonnet");

  const handleWorkSelect = async (work: Work) => {
    try {
      // Use proper typing for the query response
      const passages = await queryClient.fetchQuery<Passage[]>({
        queryKey: [`/api/works/${work.id}/passages`],
      });

      if (passages && passages.length > 0) {
        if (work.type === "sonnet") {
          // Sonnets have only one passage, navigate directly
          navigate(`/passage/${passages[0].id}`);
        } else {
          // Plays have multiple passages, navigate to work page
          navigate(`/work/${work.id}`);
        }
      }
    } catch (error) {
      console.error("Error fetching passages:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">Shakespeare's Library</h1>
        <p className="text-muted-foreground">
          Explore the complete works of William Shakespeare
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search works..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">Loading works...</div>
      ) : (
        <Tabs defaultValue="plays" className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plays">Plays</TabsTrigger>
            <TabsTrigger value="sonnets">Sonnets</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-300px)] mt-6">
            <TabsContent value="plays" className="mt-0">
              <div className="grid gap-4">
                {plays.map((play) => (
                  <Card
                    key={play.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleWorkSelect(play)}
                  >
                    <CardHeader>
                      <CardTitle>{play.title}</CardTitle>
                      <CardDescription>{play.year}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {play.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sonnets" className="mt-0">
              <div className="grid gap-4">
                {sonnets.map((sonnet) => (
                  <Card
                    key={sonnet.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleWorkSelect(sonnet)}
                  >
                    <CardHeader>
                      <CardTitle>{sonnet.title}</CardTitle>
                      <CardDescription>{sonnet.year}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {sonnet.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      )}
    </div>
  );
}