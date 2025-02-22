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
  const [isOpen, setIsOpen] = useState(false);

  const { data: definition, isLoading } = useQuery<WordDefinition>({
    queryKey: [`/api/define/${word}`],
    enabled: isOpen,
  });

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger 
          className={`inline-block cursor-pointer hover:text-primary active:text-primary/80 ${className}`}
          onClick={() => setIsOpen(true)}
        >
          {word}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center"
          sideOffset={5}
          className="max-w-sm"
          avoidCollisions
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}