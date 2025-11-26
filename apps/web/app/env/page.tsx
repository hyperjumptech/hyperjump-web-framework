import ClientEnvPage from "./client";
import { env } from "@workspace/env";

export default function EnvPage() {
  return (
    <div>
      <h1>Env Demo</h1>
      <div>
        <h2>Server component</h2>
        <ul>
          <li>DB_URL: {env.DB_POOLING_URL}</li>
          <li>DB_URL_NON_POOLING: {env.DB_URL_NON_POOLING}</li>
          <li>
            NEXT_PUBLIC_DEFAULT_LANGUAGE: {env.NEXT_PUBLIC_DEFAULT_LANGUAGE}
          </li>
          <li>
            NEXT_PUBLIC_DEFAULT_TIMEOUT_MS: {env.NEXT_PUBLIC_DEFAULT_TIMEOUT_MS}
          </li>
        </ul>
      </div>
      <div>
        <ClientEnvPage />
      </div>
    </div>
  );
}
