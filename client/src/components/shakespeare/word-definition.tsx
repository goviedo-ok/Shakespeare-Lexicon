import { WordDefinition } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface WordProps {
  word: string;
  className?: string;
}

export function Word({ word, className }: WordProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const { data: definition, isLoading } = useQuery({
    queryKey: [`/api/define/${word}`],
    enabled: isHovered,
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger 
          className={`inline-block hover:text-primary cursor-help ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {word}
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
