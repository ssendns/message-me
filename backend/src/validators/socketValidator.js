const { z } = require("zod");

const numId = z.preprocess(
  (v) => (typeof v === "string" ? Number(v) : v),
  z.number().int().positive()
);

const JoinSchema = z.object({ userId: numId });

const GetOrCreateChatSchema = z.object({ peerId: numId });

const JoinChatSchema = z.object({ chatId: numId });

const SendMessageSchema = z.object({
  chatId: numId,
  text: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  imagePublicId: z.string().nullable().optional(),
});

const EditMessageSchema = z.object({
  id: numId,
  chatId: numId,
  newText: z.string().optional(),
  newImageUrl: z.string().url().nullable().optional(),
  newImagePublicId: z.string().nullable().optional(),
});

const DeleteMessageSchema = z.object({
  id: numId,
  chatId: numId,
});

const ReadMessagesSchema = z.object({
  chatId: numId,
});

module.exports = {
  JoinSchema,
  GetOrCreateChatSchema,
  JoinChatSchema,
  SendMessageSchema,
  EditMessageSchema,
  DeleteMessageSchema,
  ReadMessagesSchema,
};
