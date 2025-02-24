import { WordDefinition } from "@shared/schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface WordProps {
  word: string;
  className?: string;
}

export function Word({ word, className }: WordProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Remove trailing punctuation and make singular form
  const cleanWord = word.replace(/[.,!?;:]/, "").toLowerCase();
  const singularWord = cleanWord.endsWith('s') ? cleanWord.slice(0, -1) : cleanWord;

  const { data: definition, isLoading } = useQuery<WordDefinition>({
    queryKey: [`/api/define/${singularWord}`],
    enabled: isOpen,
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger 
        className={`inline cursor-pointer hover:text-primary active:text-primary/80 ${className}`}
      >
        {word}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[450px] max-h-[300px] overflow-y-auto"
        align="center"
        side="top"
        sideOffset={5}
      >
        {isLoading ? (
          <p>Loading definition...</p>
        ) : definition ? (
          <div className="space-y-2">
            <p className="font-bold text-lg">{definition.word}</p>
            <p className="text-sm italic text-muted-foreground">
              {definition.partOfSpeech}
            </p>
            <div className="prose prose-sm dark:prose-invert">
              <p className="whitespace-pre-wrap">{definition.definition}</p>
            </div>
          </div>
        ) : (
          <p>No definition found</p>
        )}
      </PopoverContent>
    </Popover>
  );
}