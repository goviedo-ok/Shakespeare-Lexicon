import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const passages = pgTable("passages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  work: text("work").notNull(),
  content: text("content").notNull(),
});

export const insertPassageSchema = createInsertSchema(passages);
export type InsertPassage = z.infer<typeof insertPassageSchema>;
export type Passage = typeof passages.$inferSelect;

export type WordDefinition = {
  word: string;
  definition: string;
  partOfSpeech: string;
};
