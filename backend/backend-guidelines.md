# AI Coding Guidelines — Backend

This document defines all principles generative AI must follow — from architecture to coding conventions, validation, error handling, and testing. It is the single source of truth for how the backend is structured and written.

---

## 1. Architecture

### Folder Structure

All source code lives inside `./backend`. The structure below is the single source of truth.

```
backend/
├── api/                        # HTTP layer — routes, controllers, middleware, filters
│   ├── <slice>/                # One folder per resource (vertical slice)
│   │   ├── <slice>.controller.ts
│   │   ├── <slice>.routes.ts
│   │   └── <SliceResponse>.ts  # Response shape returned by this controller
│   ├── common/
│   │   ├── filters/            # Route-level guards (authentication, authorization)
│   │   └── middleware/         # App-level Express middleware
│   ├── config/
│   │   ├── app.config.ts       # Startup sequence — DB, services, routes
│   │   ├── services.config.ts  # Dependency injection container
│   │   └── env/                # Environment files (.env.dev, .env.prod)
│   └── index.ts                # Express entry point
│
├── auth/                       # Auth domain — vertical slices by entity
│   ├── config/
│   ├── firebase/               # External auth provider slice
│   │   ├── FirebaseService.ts
│   │   ├── IFirebaseService.ts
│   │   └── index.ts
│   ├── sessions/               # Session entity slice
│   │   ├── SessionService.ts
│   │   ├── ISessionService.ts
│   │   ├── Session.ts
│   │   ├── CredentialsArgs.ts
│   │   ├── CredentialsArgsValidator.ts
│   │   └── index.ts
│   └── users/                  # User entity slice
│       ├── user.service.ts
│       ├── IUserService.ts
│       ├── UserRepository.ts
│       ├── IUserRepository.ts
│       ├── User.ts
│       ├── RegisterArgs.ts
│       └── index.ts
│
├── businessLogic/              # Domain logic unrelated to auth — same slice rules apply
│
├── dataAccess/
│   ├── IRepository.ts          # Generic repository interface + Predicate type
│   ├── config/
│   │   └── database.config.ts
│   └── mongoDB/
│       └── Repository.ts       # Generic MongoDB implementation
│
├── errors/
│   ├── AppError.ts
│   └── index.ts
│
└── tests/                      # Mirrors source structure exactly
    ├── api/
    ├── auth/
    └── dataAccess/
```

---

### Three Layers — Strict Boundary Rules

| Layer | Folder | Responsibility |
|---|---|---|
| **HTTP** | `api/` | Receives HTTP requests, calls services, returns HTTP responses |
| **Domain** | `auth/`, `businessLogic/` | Business rules, validation, orchestration — no HTTP concepts |
| **Data Access** | `dataAccess/` | Persistence only — no business rules |

- `api/` imports from `auth/` and `businessLogic/`, never the reverse.
- `auth/` and `businessLogic/` import from `dataAccess/` via interfaces only — never MongoDB types.
- `dataAccess/` imports nothing from the layers above it.

---

### Vertical Slices

Each domain area (`auth/`, `businessLogic/`) is split into vertical slices — one folder per entity. Every slice is fully self-contained and must include:

| File | Purpose |
|---|---|
| `<Entity>.ts` | Plain data interface (no methods) |
| `<Action>Args.ts` | Input payload for each service method |
| `<Action>ArgsValidator.ts` | Zod validation for that args type |
| `I<Entity>Service.ts` | Service interface contract |
| `<entity>.service.ts` | Service implementation |
| `index.ts` | Barrel — re-exports all public members |

Additional rules:
- Service implementation files must always use `entity.service.ts` naming (for example: `session.service.ts`, `user.service.ts`, `thing.service.ts`).
- Internal service response DTOs should be avoided. If one is truly necessary, create a dedicated entity file named `<Method>Result.ts` inside the same slice.

**Example slice layout:**

```
auth/
├── sessions/
│   ├── Session.ts                  # { id, token, userId, expiresAt }
│   ├── CredentialsArgs.ts          # { email?, username?, password?, googleIdToken? }
│   ├── CredentialsArgsValidator.ts # Zod schema + validateCredentials()
│   ├── ISessionService.ts          # interface ISessionService { login(args): Promise<Session> }
│   ├── session.service.ts          # class SessionService implements ISessionService
│   ├── LoginResult.ts              # optional, only if service must return an internal DTO
│   └── index.ts
└── users/
    ├── User.ts                     # { id, email, passwordHash }
    ├── RegisterArgs.ts             # { email, password }
    ├── RegisterArgsValidator.ts    # Zod schema + validateRegister()
    ├── IUserService.ts             # interface IUserService { register(args): Promise<void> }
    ├── user.service.ts             # class UserService implements IUserService
    └── index.ts
```

---

### Request Flow — End to End

Every HTTP request follows this exact chain:

```
HTTP Request
    │
    ▼
[corsHandler]           — validates Origin header
    │
    ▼
[express.json()]        — parses request body as JSON
    │
    ▼
[Filter] (optional)     — e.g. userAuthenticationFilter — validates session token and injects authenticated user context
    │
    ▼
[asyncHandler]          — wraps handler, forwards Promise rejections to next(err)
    │
    ▼
[Controller]            — reads req.body as typed Args, calls service, sends response
    │
    ▼
[Service]               — validates Args, runs business logic, calls repository
    │
    ▼
[Repository]            — reads/writes MongoDB, throws AppError(404) if not found
    │
    ▼
[Controller]            — receives result, calls res.status(2xx).json(...)
    │
    ▼
HTTP Response

─── on any throw ─────────────────────────────────────────────

    AppError thrown anywhere in the chain
        │
        ▼
    asyncHandler → next(err) → errorHandler
        │
        ▼
    res.status(err.statusCode).json({ error_code, code, message })
```

---

### Wiring — App Bootstrap and DI Container

`app.config.ts` owns the startup sequence — called once at boot:

```ts
export async function initializeApp(app: Application): Promise<void> {
  initializeFirebase();
  const db = await connectDatabase();
  setupServices(db);
  registerRoutes(app);
}

function registerRoutes(app: Application): void {
  const api = Router();
  api.use("/auth", authRouter);
  api.use("/users", userRouter);
  app.use("/api", api);
}
```

`services.config.ts` is the dependency injection container — the only place that instantiates classes:

```ts
interface Services {
  sessionService: ISessionService;
  twoFactorService: ITwoFactorService;
  userService: IUserService;
}

export const services = {} as Services;

export function setupServices(db: Db): void {
  const sessionRepository = new Repository<Session>(db.collection("sessions"));
  const userRepository = new Repository<User>(db.collection("users"));
  services.twoFactorService = new TwoFactorService(userRepository, sessionRepository);
  services.sessionService = new SessionService(userRepository, sessionRepository, services.twoFactorService);
  services.userService = new UserService(userRepository);
}
```

Rules:
- All service fields in `Services` must be typed with the **interface** (`ISessionService`), never the implementation.
- All Repositories should be defined using the generic repository `Repository<Session>(db.collection("sessions"))`
- `services` is declared `{} as Services` so it populates after the async DB connection.
- Never instantiate services inside controllers or routes.
- Every new route group must be registered in `registerRoutes`.
- The 2FA domain logic belongs in `auth/twoFactor` and must be consumed through `ITwoFactorService`; keep `ISessionService` focused on session lifecycle.

---

### Path Aliases

All cross-folder imports use path aliases — never relative paths that cross top-level folders.

| Alias | Resolves to |
|---|---|
| `@api/*` | `./api/*` |
| `@auth/*` | `./auth/*` |
| `@businessLogic/*` | `./businessLogic/*` |
| `@dataAccess/*` | `./dataAccess/*` |
| `@errors` | `./errors/index.ts` |

```ts
// ✅ Correct
import { services } from "@api/config/services.config";
import { UserService } from "@auth/users";
import { AppError, ErrorCode } from "@errors";

// ❌ Wrong
import { services } from "../../config/services.config";
import { AppError } from "../../../errors/AppError";
import { ErrorCode } from "../../../errors/ErrorCode";
```

---

## 2. Coding Principles

### Controller — Thin HTTP Adapter

A controller handler does exactly three things: read the request, call the service, send the response.

```ts
// api/things/things.controller.ts
export const createThing = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const args: CreateThingArgs = req.body;
  const thing = await services.thingService.create(args);
  res.status(201).json(thing);
});
```

Rules:
- Cast `req.body` directly to the typed Args interface — no destructuring, no inline types.
- Wrap every handler with `asyncHandler`. Never register a raw `async` function as a route handler.
- No `try/catch` — errors propagate to `next(err)` via `asyncHandler`.
- No business logic — no conditionals, no data transformations, no validation.
- Never define response mappers inside controllers. Controllers must call mapper functions imported from response entity files.
- If a conditional branch only throws an error, it must be written with block style:
  `if (condition) {`
  `  throw new AppError(...); // one line`
  `}`
- For compound conditions, split the condition across lines for readability, and keep the `throw new AppError(...)` in one line inside the block:
  `if (comp1 === x &&`
  `    comp2 === y ||`
  `    comp3 === z) {`
  `  throw new AppError(statusCode, errorCode, message);`
  `}`
- When using environment variables in backend code, always assert presence with non-null assertion (`process.env.MY_VAR!`) and assume it is required.

### Response Entities And Mappers

Every API response shape must be defined in its own response file and include a strongly typed mapper function.

```ts
// api/users/UserResponse.ts
import type { User } from "@auth/users";

export interface UserResponse {
  id: string;
  email: string;
  username?: string;
  fullname?: string;
  surname?: string;
  dateOfBirth?: string;
  firebaseId?: string;
  incomplete: boolean;
}

export const mapUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  username: user.username,
  fullname: user.fullname,
  surname: user.surname,
  dateOfBirth: user.dateOfBirth,
  firebaseId: user.firebaseId,
  incomplete: user.incomplete,
});
```

```ts
// api/users/user.controller.ts
import { mapUserResponse } from "./UserResponse";

res.status(200).json(mapUserResponse(user));
```

Rules:
- Each response entity file must export both the response interface and its mapper function.
- Mapper functions are the single place where domain entities are converted into HTTP response DTOs.
- Controllers must only call `res.status(...).json(mapXxxResponse(...))` for entity responses.
- Do not return raw domain entities directly from controllers.
- Do not duplicate mapping logic across controllers.

`asyncHandler` is defined once and reused:

```ts
export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

---

### Routes — Wiring Only

Route files create a `Router`, attach handlers (and filters), and export the router. Nothing else.

```ts
// api/things/things.routes.ts
import { Router } from "express";
import { createThing, getThing } from "./things.controller";
import { userAuthenticationFilter } from "../common/filters/userAuthenticationFilter";

const router = Router();

router.post("/", createThing);
router.get("/:id", userAuthenticationFilter, getThing);

export { router as thingsRouter };
```

For private user endpoints, the route must not receive a user `:id` in URL params. Use authenticated self routes:

```ts
router.put("/profile", userAuthenticationFilter, updateProfile);
router.post("/password", userAuthenticationFilter, createPassword);
router.patch("/password", userAuthenticationFilter, changePassword);
```

Rules:
- Route files only compose middleware + controller handlers; no business logic.
- Any private endpoint must include `userAuthenticationFilter` before the controller.
- Controllers for private endpoints must read identity from authenticated request helpers, not from route params.

---

### Args — Strongly Typed Inputs

Every service method receives a single typed Args object. Never use loose objects or primitive parameter lists.

```ts
// ✅ Correct — named args, single parameter
async create(args: CreateThingArgs): Promise<Thing>
async update(id: string, args: UpdateThingArgs): Promise<Thing>
async get(predicate: (entity: Thing) => boolean): Promise<Thing>

// ❌ Wrong — loose, implicit shapes
async create(name: string, value: number): Promise<Thing>
async create(args: any): Promise<Thing>
```

Each Args type lives in its own file inside the slice:

```ts
// auth/things/CreateThingArgs.ts
export interface CreateThingArgs {
  name: string;
  value: number;
}
```

Rules:
- `get` methods receive a single predicate in this signature: `get(predicate: (entity: Entity) => boolean)`.
- Controllers build predicates only for public/search routes that actually use route/query criteria.
- Private routes must resolve the user from authentication context (`getAuthenticatedUserId(req)`), not from route params.
- Services relay the predicate directly to repository `getAsync`.

---

### Validators — One Per Args Type

Every Args type that requires a value validation has a co-located validator file named `<Name>Validator.ts`. Validators use Zod `safeParse` and return a discriminated union — they never throw. 

```ts
// auth/things/CreateThingArgsValidator.ts
import { z } from "zod";
import type { CreateThingArgs } from "./CreateThingArgs";

const schema = z.object({
  name: z.string().min(1, "name is required"),
  value: z.number().positive("value must be positive"),
});

export type ValidationResult =
  | { success: true; data: CreateThingArgs }
  | { success: false; errors: string[] };

export const validateCreateThing = (input: unknown): ValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }
  return { success: true, data: result.data as CreateThingArgs };
};
```

Rules:
- Always use `safeParse` — never `parse` (which throws an untyped Zod error).
- Return `{ success: true, data }` or `{ success: false, errors }` — never throw from a validator.
- Validators are pure functions — no imports from `api/`, no side effects.

---

### Service — Validate First, Then Execute

The service is the only place that validates and the only place that contains business logic.

```ts
// auth/things/thing.service.ts
export class ThingService implements IThingService {
  constructor(private readonly thingRepository: IRepository<Thing>) {}

  async create(args: CreateThingArgs): Promise<Thing> {
    const validation = validateCreateThing(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(", ")}`);
    }

    const existing = await this.thingRepository
      .existsAsync((t) => t.name === args.name)
    if (existing) {
      throw new AppError(409, ErrorCode.CONFLICT, "A thing with this name already exists.");
    }

    return this.thingRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      name: args.name,
      value: args.value,
    });
  }
}
```

Rules:
- Call the validator at the top of every method that accepts external input.
- Throw `AppError` (never `new Error(...)`) for all expected failure conditions.
- Depend on `IRepository<T>` or a domain repository interface — never the concrete class.
- Receive all dependencies via constructor injection — never instantiate inside the service.
- Never import anything from `api/` — no `Request`, `Response`, or Express types.

---

### Service Interface

Every service has a matching interface that defines the public contract.

```ts
// auth/things/IThingService.ts
import type { CreateThingArgs } from "./CreateThingArgs";
import type { Thing } from "./Thing";

export interface IThingService {
  create(args: CreateThingArgs): Promise<Thing>;
}
```

The DI container types all services by their interface. Controllers never reference the implementation class.

---

### Repository — Generic and Entity-Specific

`IRepository<T>` is the generic contract all repositories implement:

```ts
export type Predicate<T> = (entity: T) => boolean;

export interface IRepository<T extends { id: string }> {
  existsAsync(predicate: Predicate<T>): Promise<boolean>;
  getAsync(predicate: Predicate<T>): Promise<T>;
  getAllAsync(predicate: Predicate<T>): Promise<T[]>;
  createAndSaveAsync(entity: T): Promise<T>;
  createAsync(entity: T): T;
  updateByIdAndSaveAsync(id: string, entity: T): Promise<T>;
  updateByIdAsync(id: string, entity: T): T;
}
```

Rules:
- Use the plain `IRepository<Thing>` always, in case of needing a new generic funcion make it but it should be generic for every single entity.
- Never add business logic to repositories — only persistence and lookup operations.

---

### Error Handling

All expected failures throw `AppError`. Never use `throw new Error(...)` for domain or HTTP errors.

```ts
import { AppError, ErrorCode } from "@errors";

throw new AppError(400, ErrorCode.VALIDATION_ERROR, `Validation failed: ${errors.join(", ")}`);
throw new AppError(404, ErrorCode.NOT_FOUND, "Thing not found.");
throw new AppError(409, ErrorCode.CONFLICT, "A thing with this name already exists.");
throw new AppError(401, ErrorCode.UNAUTHORIZED, "Authentication required.");
```

The global `errorHandler` in `api/common/middleware/errorHandler.ts` is the only place that translates errors to HTTP responses:

```ts
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ code: err.code, message: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : "An unexpected error occurred.";
  res.status(500).json({ code: "INTERNAL_ERROR", message });
};
```

Rules:
- Controllers never call `res.status(4xx)` directly for errors — always throw `AppError`.
- Always use `ErrorCode` constants from `@errors` — never write raw strings inline.
- `AppError` bubbles up through `asyncHandler → next(err) → errorHandler` automatically.
- `errorHandler` responses must always include `error_code` (snake_case) with the same value as the backend error code constant.
- Keep `code` in the response only as compatibility alias when needed, but `error_code` is the contract used by frontend error mapping.

### Authentication Filter Contract

`userAuthenticationFilter` is the only supported auth guard for private HTTP endpoints.

Rules:
- Read Bearer token from `Authorization` header and reject malformed/missing headers with `AppError(401, ErrorCode.UNAUTHORIZED, ...)`.
- Validate the token against persisted sessions in the repository (never trust token format alone).
- Resolve the authenticated user from DB and attach both `authenticatedUser` and `authenticatedSessionToken` to the request.
- Controllers must consume authenticated context via `toAuthenticatedRequest(req)`, `getAuthenticatedUserId(req)`, or `getAuthenticatedSessionToken(req)`.
- Never duplicate auth parsing/validation logic inside controllers.

---

### Barrel Exports

Every slice folder has an `index.ts` that re-exports all public members.

```ts
// auth/things/index.ts
export type { IThingService } from "./IThingService";
export type { IThingRepository } from "./IThingRepository";
export type { Thing } from "./Thing";
export type { CreateThingArgs } from "./CreateThingArgs";
export { ThingService } from "./thing.service";
export { ThingRepository } from "./ThingRepository";
```

Rules:
- Import from the slice barrel, never from internal files:
  ```ts
  // ✅ Correct
  import { ThingService, ThingRepository } from "@auth/things";

  // ❌ Wrong
  import { ThingService } from "@auth/things/thing.service";
  ```
- Use `export type { ... }` for interfaces and types — keep them distinct from value exports.
- `index.ts` files contain no logic — they are excluded from coverage collection.

---

## 3. Utilities

### Folder Structure

Reusable pure functions that don't belong to any domain slice live in `backend/utils/`:

```
utils/
├── caseInsensitiveCompare.ts  # Case-insensitive string comparison
└── index.ts                   # Barrel — re-exports all utilities
```

### Rules

- Utilities are **pure functions** — no imports from `api/`, `auth/`, `dataAccess/`, or any domain module.
- Each utility lives in its own file named after what it does (`camelCase.ts`).
- All utilities are re-exported via the barrel `index.ts`.
- Import utilities via the `@utils` alias — never via relative paths.
- Every utility file must have a corresponding test file in `tests/utils/`.

```ts
// ✅ Correct
import { caseInsensitiveCompare } from "@utils";

// ❌ Wrong
import { caseInsensitiveCompare } from "../../utils/caseInsensitiveCompare";
```

### Path Alias

| Alias | Resolves to |
|---|---|
| `@utils` | `./utils/index.ts` |

### Example

```ts
// utils/caseInsensitiveCompare.ts
export const caseInsensitiveCompare = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();
```

```ts
// utils/index.ts
export { caseInsensitiveCompare } from "./caseInsensitiveCompare";
```

---

## 4. Testing

### Structure

Tests live in `backend/tests/` and mirror the source folder structure exactly:

```
tests/
├── api/
│   └── things.controller.test.ts    # mirrors api/things/
├── auth/
│   ├── CreateThingArgsValidator.test.ts
│   └── ThingService.test.ts
└── dataAccess/
    └── Repository.test.ts
```

Every source file in `api/`, `auth/`, and `dataAccess/` must have a corresponding test file, except `index.ts` barrel files.

---

### Coverage Requirement — 100%

100% coverage is mandatory across lines, branches, functions, and statements. The Jest config enforces this — the build fails if any threshold drops below 100%.

```ts
coverageThreshold: {
  global: { lines: 100, functions: 100, branches: 100, statements: 100 }
}
```

The coverage output folder (`tests/coverage/`) must be in `.gitignore` — never commit generated coverage reports.

```
# .gitignore
tests/coverage/
```

Write tests alongside every new file. Do not defer testing.

---

### What to Test

| Source file | Scenarios to cover |
|---|---|
| **Controller** | Happy path (correct status + response body); service error forwarded to `next()` |
| **Service** | Happy path; each validation failure; each `AppError` throw site; each branch |
| **Validator** | All valid input combinations; each individual validation rule failure |
| **Repository** | exists by predicate; found by predicate; not found (throws); insert; update |
| **Filter** | Valid token/session; missing token; malformed token; session not found; user not found |

---

### Factory Helpers — Mocking Pattern

Use `jest.mock()` before imports for module-level mocks. Use typed factory functions to build mock instances.

```ts
// 1. Mock the module before importing the unit under test
const mockCreate = jest.fn();

jest.mock("@api/config/services.config", () => ({
  services: { thingService: { create: mockCreate } },
}));

import { createThing } from "@api/things/things.controller";
```

For repository and service mocks, use factory functions so each test only specifies what it overrides:

```ts
function makeThingRepo(
  overrides: Partial<IRepository<Thing>> = {},
): jest.Mocked<IRepository<Thing>> {
  return {
    getByIdAsync: jest.fn(),
    getAsync: jest.fn(),
    getAllAsync: jest.fn(),
    createAndSaveAsync: jest.fn(),
    createAsync: jest.fn(),
    updateByIdAndSaveAsync: jest.fn(),
    updateByIdAsync: jest.fn(),
    ...overrides,
  } as jest.Mocked<IRepository<Thing>>;
}

function makeThing(overrides: Partial<Thing> = {}): Thing {
  return { id: "thing-1", name: "widget", value: 42, ...overrides };
}
```

Each test overrides only what it needs:

```ts
it("throws CONFLICT when name already exists", async () => {
  const existing = makeThing();
  const repo = makeThingRepo({
    getAsync: jest.fn().mockResolvedValue(existing),
  });
  const svc = new ThingService(repo);

  await expect(svc.create({ name: existing.name, value: 10 }))
    .rejects.toThrow(AppError);
});
```

---

### Controller Test Pattern

```ts
function makeReq(body: object = {}): Partial<Request> {
  return { body };
}

function makeRes(): { res: Partial<Response>; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  return { res: { json, status } as any, json, status };
}

function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

afterEach(() => jest.clearAllMocks());

describe("createThing controller", () => {
  it("calls thingService.create with request body and returns 201", async () => {
    const thing = makeThing();
    mockCreate.mockResolvedValue(thing);

    const req = makeReq({ name: "widget", value: 42 });
    const { res, json, status } = makeRes();

    await createThing(req as Request, res as Response, makeNext());

    expect(mockCreate).toHaveBeenCalledWith({ name: "widget", value: 42 });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(thing);
  });

  it("forwards error to next() when service throws", async () => {
    const error = new AppError(409, ErrorCode.CONFLICT, "Already exists.");
    mockCreate.mockRejectedValue(error);
    const next = makeNext();

    await createThing(makeReq() as Request, makeRes().res as Response, next).catch(next as any);

    expect(next).toHaveBeenCalledWith(error);
  });
});
```

---

### Test Naming

- `describe` blocks: named after the class and method — `describe("ThingService.create", () => { ... })`
- `it` blocks: plain English — `it("throws CONFLICT when name already exists")`
- Nested `describe` for grouping: `describe("— validation", () => { ... })`

---

### Running Tests

```bash
# from backend/
npm test                                           # all tests + coverage
npm test -- --watch                                # watch mode
npm test -- --testPathPattern=ThingService         # single file
```

Coverage report is written to `tests/coverage/` (gitignored).