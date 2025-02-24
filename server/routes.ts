import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import { shakespeareWorks, passages } from "./shakespeare-data";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all works (plays and sonnets)
  app.get("/api/works", (_req, res) => {
    res.json(shakespeareWorks);
  });

  // Get a specific work by ID
  app.get("/api/works/:id", (req, res) => {
    const work = shakespeareWorks.find(w => w.id === parseInt(req.params.id));
    if (!work) {
      res.status(404).json({ message: "Work not found" });
      return;
    }
    res.json(work);
  });

  // Get all passages for a work
  app.get("/api/works/:workId/passages", (req, res) => {
    const workPassages = passages.filter(p => p.workId === parseInt(req.params.workId));
    if (!workPassages.length) {
      res.status(404).json({ message: "No passages found for this work" });
      return;
    }
    res.json(workPassages);
  });

  // Get a specific passage
  app.get("/api/passages/:id", (req, res) => {
    const passage = passages.find(p => p.id === parseInt(req.params.id));
    if (!passage) {
      res.status(404).json({ message: "Passage not found" });
      return;
    }
    res.json(passage);
  });

  // Search works
  app.get("/api/search", (req, res) => {
    const query = (req.query.q as string || "").toLowerCase();
    const filteredWorks = shakespeareWorks.filter(work => 
      work.title.toLowerCase().includes(query) ||
      work.description.toLowerCase().includes(query)
    );
    res.json(filteredWorks);
  });

  app.get("/api/define/:word", async (req, res) => {
    try {
      const word = req.params.word.toLowerCase();
      const response = await fetch(
        `http://localhost:3001/api/lexicon/${word}`
      );

      if (!response.ok) {
        res.status(404).json({ message: "Definition not found" });
        return;
      }

      const definition = await response.json();
      res.json(definition);
    } catch (error) {
      res.status(500).json({ message: "Error fetching definition" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}