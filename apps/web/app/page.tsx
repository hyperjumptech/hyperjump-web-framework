import { Button } from "@workspace/ui/components/button";
import { env } from "@workspace/env";

export default function Page() {
  const isOdd = env.IS_ODD;
  const shouldRender = isOdd?.includes("_yo");

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
        <Button size="sm">Button</Button>
        {shouldRender && <p>Is odd yo</p>}
      </div>
    </div>
  );
}
