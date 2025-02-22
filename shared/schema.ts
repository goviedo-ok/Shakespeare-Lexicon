import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const works = pgTable("works", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'play' or 'sonnet'
  year: integer("year"),
  description: text("description"),
});

export const passages = pgTable("passages", {
  id: serial("id").primaryKey(),
  workId: integer("work_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  act: integer("act"), // null for sonnets
  scene: integer("scene"), // null for sonnets
});

export const insertWorkSchema = createInsertSchema(works);
export const insertPassageSchema = createInsertSchema(passages);

export type InsertWork = z.infer<typeof insertWorkSchema>;
export type InsertPassage = z.infer<typeof insertPassageSchema>;
export type Work = typeof works.$inferSelect;
export type Passage = typeof passages.$inferSelect;

export type WordDefinition = {
  word: string;
  definition: string;
  partOfSpeech: string;
};