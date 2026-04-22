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
    { name: "Tickets", description: "Gestão de chamados [US-02]" },
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
      TicketStatus: {
        type: "string",
        enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELED"],
        description: "Status do ticket (default: OPEN).",
      },
      TicketPriority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        description: "Prioridade do ticket (default: MEDIUM).",
      },
      Location: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Sala 101" },
          building: { type: "string", example: "Prédio A" },
          floor: { type: "string", example: "1º andar" },
        },
        required: ["id", "name", "building", "floor"],
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Manutenção" },
          slaHours: { type: "number", example: 24 },
        },
        required: ["id", "name", "slaHours"],
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Ar condicionado não está funcionando" },
          description: { type: "string", example: "Ar-condicionado da sala 101 está com problema" },
          status: { $ref: "#/components/schemas/TicketStatus" },
          priority: { $ref: "#/components/schemas/TicketPriority" },
          reporterId: { type: "string", format: "uuid" },
          assigneeId: { type: "string", format: "uuid", nullable: true },
          categoryId: { type: "string", format: "uuid" },
          locationId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "title", "status", "priority", "reporterId", "categoryId", "locationId", "createdAt", "updatedAt"],
      },
      CreateTicketInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 100, example: "Ar condicionado quebrado" },
          description: { type: "string", maxLength: 500, example: "O ar-condicionado da sala 101 parou de funcionar" },
          locationId: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
          categoryId: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440001" },
          priority: { $ref: "#/components/schemas/TicketPriority" },
        },
        required: ["title", "locationId", "categoryId"],
      },
      TicketListResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
          total: { type: "number" },
          page: { type: "number" },
          pageSize: { type: "number" },
          totalPages: { type: "number" },
        },
        required: ["data", "total", "page", "pageSize", "totalPages"],
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
    "/tickets": {
      post: {
        tags: ["Tickets"],
        summary: "Criar novo ticket",
        description: "Cria um novo ticket de chamado. O reporter é extraído do JWT token.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTicketInput" },
              example: {
                title: "Ar condicionado não funciona",
                description: "AC da sala 101 parou de funcionar",
                locationId: "550e8400-e29b-41d4-a716-446655440000",
                categoryId: "550e8400-e29b-41d4-a716-446655440001",
                priority: "HIGH",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Ticket criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
          401: {
            description: "Token inválido ou ausente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Localização ou categoria não encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "NOT_FOUND", message: "Localização não encontrada" },
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
      get: {
        tags: ["Tickets"],
        summary: "Listar tickets com filtros",
        description: "Retorna lista paginada de tickets. Todos os filtros são opcionais.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELED"] }, description: "Filtrar por status" },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] }, description: "Filtrar por prioridade" },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por categoria" },
          { name: "locationId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por localização" },
          { name: "assigneeId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por responsável" },
          { name: "page", in: "query", schema: { type: "number", default: 1 }, description: "Número da página (padrão: 1)" },
          { name: "pageSize", in: "query", schema: { type: "number", default: 20, maximum: 100 }, description: "Tamanho da página (padrão: 20, máximo: 100)" },
        ],
        responses: {
          200: {
            description: "Lista de tickets",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TicketListResponse" },
              },
            },
          },
          401: {
            description: "Token inválido ou ausente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/tickets/{id}": {
      get: {
        tags: ["Tickets"],
        summary: "Obter ticket por ID",
        description: "Retorna detalhes de um ticket específico.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID do ticket" },
        ],
        responses: {
          200: {
            description: "Ticket encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Ticket" },
              },
            },
          },
          401: {
            description: "Token inválido ou ausente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Ticket não encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "NOT_FOUND", message: "Ticket não encontrado" },
              },
            },
          },
        },
      },
    },
  },
} as const;
