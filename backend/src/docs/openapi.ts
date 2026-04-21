export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "HelpDesk Operacional API",
    version: "0.1.0",
    description:
      "API REST do HelpDesk Operacional — gestão de chamados e manutenção de facilities. " +
      "Sprint 1: autenticação (US-01). As rotas de Tickets (US-02) e Dashboard (US-03) " +
      "serão adicionadas pelos PRs do Pedro e do Thiago.",
    contact: {
      name: "Equipe HelpDesk (GCC267 - UFLA 2026/1)",
      url: "https://github.com/Lucas-Henrique-Lopes-Costa/HelpDesk",
    },
  },
  servers: [
    { url: "http://localhost:3333", description: "Desenvolvimento local" },
  ],
  tags: [
    { name: "Health", description: "Status do serviço" },
    { name: "Auth", description: "Cadastro e autenticação via JWT" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Use o token retornado por POST /auth/login ou POST /auth/register. " +
          "Clique em Authorize e cole apenas o token (sem o prefixo 'Bearer ').",
      },
    },
    schemas: {
      UserRole: {
        type: "string",
        enum: ["ADMIN", "MANAGER", "REQUESTER", "OPERATOR"],
        description:
          "ADMIN: gestão global. MANAGER: gestor de facilities. " +
          "REQUESTER: solicitante (colaborador). OPERATOR: equipe operacional.",
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/UserRole" },
        },
        required: ["id", "name", "email", "role"],
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT assinado" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
        required: ["token", "user"],
      },
      RegisterInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, example: "Lucas Henrique" },
          email: { type: "string", format: "email", example: "lucas@helpdesk.local" },
          password: { type: "string", minLength: 6, example: "secret123" },
          role: {
            $ref: "#/components/schemas/UserRole",
            description: "Opcional. Default REQUESTER.",
          },
        },
        required: ["name", "email", "password"],
      },
      LoginInput: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "lucas@helpdesk.local" },
          password: { type: "string", example: "secret123" },
        },
        required: ["email", "password"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "CONFLICT" },
          message: { type: "string", example: "Já existe um usuário com este e-mail" },
        },
        required: ["error", "message"],
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "VALIDATION_ERROR" },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string", example: "email" },
                message: { type: "string", example: "E-mail inválido" },
              },
            },
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          service: { type: "string", example: "helpdesk-backend" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        description: "Retorna 200 se o serviço está de pé. Usado pelo Docker healthcheck e CI.",
        responses: {
          200: {
            description: "Serviço saudável",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Cadastrar novo usuário [US-01]",
        description:
          "Cria um usuário e já devolve o JWT. O campo `role` é opcional; se omitido, " +
          "o usuário é criado como REQUESTER. Senha é armazenada como hash bcrypt.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
              examples: {
                solicitante: {
                  summary: "Solicitante (colaborador)",
                  value: {
                    name: "Ana Costa",
                    email: "ana@helpdesk.local",
                    password: "secret123",
                  },
                },
                gestor: {
                  summary: "Gestor (admin cadastra)",
                  value: {
                    name: "Carlos Silva",
                    email: "carlos@helpdesk.local",
                    password: "secret123",
                    role: "MANAGER",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Usuário criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          409: {
            description: "E-mail já cadastrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "CONFLICT", message: "Já existe um usuário com este e-mail" },
              },
            },
          },
          422: {
            description: "Dados inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autenticar usuário existente [US-01]",
        description:
          "Autentica via e-mail e senha e retorna um JWT (sub, email, role) válido por 1 dia. " +
          "Use o token no header Authorization: Bearer <token> nas rotas protegidas.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
              example: { email: "lucas@helpdesk.local", password: "secret123" },
            },
          },
        },
        responses: {
          200: {
            description: "Autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: {
            description: "Credenciais inválidas ou usuário inativo",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "UNAUTHORIZED", message: "Credenciais inválidas" },
              },
            },
          },
          422: {
            description: "Dados inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const;
