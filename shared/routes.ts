import { z } from 'zod';
import { insertProjectSchema, insertFileSchema, insertMessageSchema, projects, files, messages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: insertProjectSchema.pick({ name: true }),
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.custom<typeof projects.$inferSelect & { files: typeof files.$inferSelect[], messages: typeof messages.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  files: {
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/files',
      input: insertFileSchema.omit({ id: true, projectId: true }),
      responses: {
        201: z.custom<typeof files.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/files/:id',
      input: z.object({ content: z.string() }),
      responses: {
        200: z.custom<typeof files.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/files/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  chat: {
    send: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/chat',
      input: z.object({ prompt: z.string() }),
      responses: {
        200: z.object({
          message: z.custom<typeof messages.$inferSelect>(),
          generatedFiles: z.array(z.custom<typeof files.$inferSelect>()).optional()
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
