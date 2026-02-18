/**
 * To test this end point during development, run the following command:
 *
 * 1. Run "docker-compose up" from the root of the monorepo to start the email server.
 * 2. Set the environment variable "NODE_ENV" to "development".
 * 3. Run the development server by running "pnpm dev --filter=web" from the root of the monorepo.
 * 4. Send a request to the end point using the following command:
 * curl -X POST http://localhost:3000/api/email-demo -H "Content-Type: application/json" -d '{"email": "test@example.com", "name": "Test User"}'
 */

import { z } from "zod";
import {
  createRequestValidator,
  HandlerFunc,
  successResponse,
} from "route-action-gen/lib";
import { getEmailSender } from "@/lib/email/smtp";

const bodyValidator = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const requestValidator = createRequestValidator({
  body: bodyValidator,
});

export const responseValidator = z.object({
  success: z.boolean(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { body } = data;

  const emailSender = getEmailSender();

  await emailSender.send({
    to: body.email,
    subject: "Hello, World!",
    template: "user/signup",
    data: {
      name: body.name,
      verifyUrl: "https://example.com/verify?token=123",
    },
  });

  return successResponse({
    success: true,
  });
};
