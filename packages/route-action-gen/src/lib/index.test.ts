import { describe, expect, test } from "vitest";
import {
  createRequestValidator,
  errorResponse,
  mapZodError,
  successResponse,
} from "./index.js";
import z from "zod";

describe("index", () => {
  test("createRequestValidator should return a request validator object", () => {
    const requestValidator = createRequestValidator({
      body: z.object({
        name: z.string(),
      }),
      params: z.object({
        id: z.string(),
      }),
      headers: z.object({
        authorization: z.string(),
      }),
      searchParams: z.object({
        name: z.string(),
      }),
      user: async (request?: Request) => {
        return {
          id: request?.headers.get("authorization"),
        };
      },
    });
    expect(requestValidator).toBeDefined();
    expect(requestValidator.body).toBeDefined();
    expect(requestValidator.params).toBeDefined();
    expect(requestValidator.headers).toBeDefined();
    expect(requestValidator.searchParams).toBeDefined();
    expect(requestValidator.user).toBeDefined();
  });

  test("successResponse should return a success response object", () => {
    const response = successResponse({
      id: "123",
    });
    expect(response).toBeDefined();
    expect(response.status).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(response.data).toBeDefined();
  });

  test("errorResponse should return an error response object", () => {
    const response = errorResponse("Error", {
      id: "123",
    });
    expect(response).toBeDefined();
    expect(response.status).toBe(false);
    expect(response.statusCode).toBe(500);
    expect(response.message).toBe("Error");
  });

  test("mapZodError should return an array of validation errors", () => {
    const schema = z.object({
      name: z.string(),
    });
    const { error } = schema.safeParse({
      name: 123,
    });
    const errors = mapZodError(error!);
    expect(errors).toBeDefined();
    expect(errors).toEqual([
      {
        name: "name",
        message: "Expected string, received number",
        code: "validation:invalid_type",
      },
    ]);
  });
});
