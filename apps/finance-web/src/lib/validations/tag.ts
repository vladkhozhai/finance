/**
 * Tag Validation Schemas
 *
 * Zod schemas for validating tag-related inputs.
 */

import { z } from "zod";
import { uuidSchema } from "./shared";

/**
 * Schema for creating a new tag.
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(100, "Tag name must be 100 characters or less")
    .trim(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

/**
 * Schema for updating an existing tag.
 */
export const updateTagSchema = z.object({
  id: uuidSchema,
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(100, "Tag name must be 100 characters or less")
    .trim(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;

/**
 * Schema for deleting a tag.
 */
export const deleteTagSchema = z.object({
  id: uuidSchema,
});

export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
