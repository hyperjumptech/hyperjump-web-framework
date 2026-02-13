"use client";

import { Button } from "@workspace/ui/components/button";
import { useFormAction } from "../api/posts/[postId]/.generated/use-form-action";
import { formComponents } from "../api/posts/[postId]/.generated/form-components";
import React from "react";

export default function ServerFunctionDemoPage() {
  const { FormWithAction, state, pending } = useFormAction();
  return (
    <div className="flex flex-col gap-4 p-4 mx-auto max-w-md">
      <h1>Server Function Demo (useFormAction)</h1>
      {pending && <div>Pending...</div>}
      {state && state.status && <div>Post ID: {state.data.id}</div>}
      {state && !state.status && <div>Error: {state.message}</div>}
      <FormWithAction className="flex flex-col gap-2 [&_input]:border-input [&_input]:rounded-md [&_input]:border [&_input]:p-2">
        {Object.entries(formComponents).map(([key, component]) => {
          return (
            <React.Fragment key={key}>
              <component.label />
              <component.input />
            </React.Fragment>
          );
        })}
        <Button disabled={pending} type="submit">
          Submit
        </Button>
      </FormWithAction>
    </div>
  );
}
