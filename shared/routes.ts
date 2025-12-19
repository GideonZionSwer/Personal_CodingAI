import { z } from 'zod';
import { insertProjectSchema, insertFileSchema, insertMessageSchema, insertTemplateSchema, projects, files, messages, templates, fileVersions, uploads } from './schema';

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
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.custom<typeof projects.$inferSelect & { 
          files: typeof files.$inferSelect[], 
          messages: typeof messages.$inferSelect[],
          uploads: typeof uploads.$inferSelect[]
        }>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/projects/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  files: {
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/files',
      input: insertFileSchema,
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
    download: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/download',
      responses: {
        200: z.unknown(),
      },
    },
    suggest: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/files/suggest/:query',
      responses: {
        200: z.array(z.custom<typeof files.$inferSelect>()),
      },
    },
  },
  versions: {
    list: {
      method: 'GET' as const,
      path: '/api/files/:fileId/versions',
      responses: {
        200: z.array(z.custom<typeof fileVersions.$inferSelect>()),
      },
    },
  },
  uploads: {
    create: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/uploads',
      input: z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        filePath: z.string(),
      }),
      responses: {
        201: z.custom<typeof uploads.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/projects/:projectId/uploads',
      responses: {
        200: z.array(z.custom<typeof uploads.$inferSelect>()),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/uploads/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  templates: {
    list: {
      method: 'GET' as const,
      path: '/api/templates',
      responses: {
        200: z.array(z.custom<typeof templates.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/templates',
      input: insertTemplateSchema,
      responses: {
        201: z.custom<typeof templates.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/templates/:id',
      responses: {
        204: z.void(),
      },
    },
    useTemplate: {
      method: 'POST' as const,
      path: '/api/projects/:projectId/use-template/:templateId',
      responses: {
        200: z.array(z.custom<typeof files.$inferSelect>()),
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
