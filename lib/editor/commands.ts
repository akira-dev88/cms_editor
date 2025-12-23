// lib/editor/commands.ts (example path)
import { createCommand } from "lexical"

export type InsertImagePayload = {
  src: string
  altText?: string
}

export const INSERT_IMAGE_COMMAND =
  createCommand<InsertImagePayload>("INSERT_IMAGE_COMMAND")
