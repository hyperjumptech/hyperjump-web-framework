import { Button } from "@workspace/ui/components/button";
import { connection } from "next/server";

export default async function Page() {
  await connection();
  const isEven = process.env.IS_EVEN;
  const shouldRender = isEven?.includes("_yo");
  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Even page</h1>
        <Button size="sm">Button</Button>
        {shouldRender && <p>Is even yo</p>}
      </div>
    </div>
  );
}
