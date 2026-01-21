import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(5),
    description: z.string().min(10).optional(),

    date: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), {
      message: "Date invalide dans le frontmatter (ex: 2025-11-27)",
    }),

    author: z.string().default("Carole Yché"),
    tags: z.array(z.string().transform((t) => t.trim())).default([]),

    category: z.string().transform((c) => c.trim()).optional(),

    canonical: z.string().url().optional(),

    // Brouillon
    draft: z.boolean().optional(),

    // FAQ pour schema.org + affichage
    faq: z
      .array(
        z.object({
          q: z.string().min(5),
          a: z.string().min(10),
        })
      )
      .optional(),
  }),
});

export const collections = { blog };
