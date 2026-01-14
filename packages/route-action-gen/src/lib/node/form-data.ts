export function parseFormData(formData: FormData) {
  const result: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    setNestedValue(result, key, value);
  }

  console.log("result", result);

  return result;
}

function setNestedValue(obj: Record<string, any>, path: string, value: any) {
  const keys = path.split(".");
  let current: Record<string, any> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue;

    // Handle array notation like "items[0]"
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);

    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const indexStr = arrayMatch[2];
      if (!arrayKey || !indexStr) continue;

      const index = Number.parseInt(indexStr, 10);
      if (!current[arrayKey]) current[arrayKey] = [];
      if (!current[arrayKey][index]) current[arrayKey][index] = {};
      current = current[arrayKey][index] as Record<string, any>;
    } else {
      if (!current[key]) current[key] = {};
      current = current[key] as Record<string, any>;
    }
  }

  const finalKey = keys[keys.length - 1];
  if (!finalKey) return;

  const arrayMatch = finalKey.match(/^(.+)\[(\d+)\]$/);

  if (arrayMatch) {
    const arrayKey = arrayMatch[1];
    const indexStr = arrayMatch[2];
    if (!arrayKey || !indexStr) return;

    const index = Number.parseInt(indexStr, 10);
    if (!current[arrayKey]) current[arrayKey] = [];
    current[arrayKey][index] = value;
  } else {
    current[finalKey] = value;
  }
}
