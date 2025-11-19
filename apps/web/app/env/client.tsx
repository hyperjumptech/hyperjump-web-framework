"use client";

import { env } from "@workspace/env";

export default function ClientEnvPage() {
  return (
    <div>
      <h1>Client Component</h1>
      <ul>
        <li>
          NEXT_PUBLIC_DEFAULT_LANGUAGE: {env.NEXT_PUBLIC_DEFAULT_LANGUAGE}
        </li>
        <li>
          timeout: {(env.NEXT_PUBLIC_DEFAULT_TIMEOUT_MS ?? 0) / 1000} seconds
        </li>
        {/* <li>DB_URL_NON_POOLING: {env.DB_URL_NON_POOLING}</li>
        <li>DB_POOLING_URL: {env.DB_POOLING_URL}</li> */}
      </ul>
    </div>
  );
}
