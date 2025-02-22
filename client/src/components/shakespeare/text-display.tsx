import { Word } from "./word-definition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Passage } from "@shared/schema";

interface TextDisplayProps {
  passage: Passage;
}

export function TextDisplay({ passage }: TextDisplayProps) {
  const words = passage.content.split(/(\s+)/);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">{passage.title}</CardTitle>
        <p className="text-muted-foreground italic">from {passage.work}</p>
      </CardHeader>
      <CardContent className="prose prose-lg dark:prose-invert">
        <div className="whitespace-pre-wrap font-serif leading-relaxed">
          {words.map((word, i) => {
            // Skip rendering spaces as Word components
            if (word.trim() === "") {
              return word;
            }
            
            // Remove punctuation for the lookup but keep it for display
            const cleanWord = word.replace(/[.,!?;:]/, "");
            return <Word key={i} word={cleanWord} className="hover:text-primary transition-colors" />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
