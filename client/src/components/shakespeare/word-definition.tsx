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

  const { data: definition, isLoading } = useQuery<WordDefinition>({
    queryKey: [`/api/define/${word}`],
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
        className="max-w-sm"
        align="center"
        side="top"
        sideOffset={5}
      >
        {isLoading ? (
          <p>Loading definition...</p>
        ) : definition ? (
          <div className="space-y-1">
            <p className="font-bold">{definition.word}</p>
            <p className="text-sm italic text-muted-foreground">
              {definition.partOfSpeech}
            </p>
            <p>{definition.definition}</p>
          </div>
        ) : (
          <p>No definition found</p>
        )}
      </PopoverContent>
    </Popover>
  );
}