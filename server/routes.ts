import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import { samplePassages } from "./shakespeare-data";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/passages", (_req, res) => {
    res.json(samplePassages);
  });

  app.get("/api/passages/:id", (req, res) => {
    const passage = samplePassages.find(p => p.id === parseInt(req.params.id));
    if (!passage) {
      res.status(404).json({ message: "Passage not found" });
      return;
    }
    res.json(passage);
  });

  app.get("/api/define/:word", async (req, res) => {
    try {
      const word = req.params.word.toLowerCase();
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );
      
      if (!response.ok) {
        res.status(404).json({ message: "Definition not found" });
        return;
      }

      const data = await response.json();
      const definition = {
        word: data[0].word,
        definition: data[0].meanings[0].definitions[0].definition,
        partOfSpeech: data[0].meanings[0].partOfSpeech
      };
      
      res.json(definition);
    } catch (error) {
      res.status(500).json({ message: "Error fetching definition" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
