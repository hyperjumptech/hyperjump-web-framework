import { describe, it, expect } from "vitest";
import { parseFormData } from "./form-data.js";

describe("parseFormData", () => {
  it("should parse simple flat key-value pairs", () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("age", "30");

    const result = parseFormData(formData);

    expect(result).toEqual({
      name: "John",
      age: "30",
    });
  });

  it("should parse nested objects with dot notation", () => {
    const formData = new FormData();
    formData.append("user.name", "John");
    formData.append("user.email", "john@example.com");
    formData.append("user.address.city", "New York");

    const result = parseFormData(formData);

    expect(result).toEqual({
      user: {
        name: "John",
        email: "john@example.com",
        address: {
          city: "New York",
        },
      },
    });
  });

  it("should parse array notation", () => {
    const formData = new FormData();
    formData.append("items[0]", "apple");
    formData.append("items[1]", "banana");
    formData.append("items[2]", "cherry");

    const result = parseFormData(formData);

    expect(result).toEqual({
      items: ["apple", "banana", "cherry"],
    });
  });

  it("should parse nested arrays with dot notation", () => {
    const formData = new FormData();
    formData.append("user.hobbies[0]", "reading");
    formData.append("user.hobbies[1]", "coding");
    formData.append("user.hobbies[2]", "gaming");

    const result = parseFormData(formData);

    expect(result).toEqual({
      user: {
        hobbies: ["reading", "coding", "gaming"],
      },
    });
  });

  it("should parse arrays of objects", () => {
    const formData = new FormData();
    formData.append("users[0].name", "John");
    formData.append("users[0].age", "30");
    formData.append("users[1].name", "Jane");
    formData.append("users[1].age", "25");

    const result = parseFormData(formData);

    expect(result).toEqual({
      users: [
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ],
    });
  });

  it("should parse deeply nested structures", () => {
    const formData = new FormData();
    formData.append("company.departments[0].name", "Engineering");
    formData.append("company.departments[0].employees[0].name", "Alice");
    formData.append("company.departments[0].employees[0].role", "Developer");
    formData.append("company.departments[0].employees[1].name", "Bob");
    formData.append("company.departments[0].employees[1].role", "Manager");

    const result = parseFormData(formData);

    expect(result).toEqual({
      company: {
        departments: [
          {
            name: "Engineering",
            employees: [
              { name: "Alice", role: "Developer" },
              { name: "Bob", role: "Manager" },
            ],
          },
        ],
      },
    });
  });

  it("should handle mixed flat and nested values", () => {
    const formData = new FormData();
    formData.append("title", "My Form");
    formData.append("user.name", "John");
    formData.append("tags[0]", "tag1");
    formData.append("tags[1]", "tag2");

    const result = parseFormData(formData);

    expect(result).toEqual({
      title: "My Form",
      user: {
        name: "John",
      },
      tags: ["tag1", "tag2"],
    });
  });

  it("should handle empty form data", () => {
    const formData = new FormData();

    const result = parseFormData(formData);

    expect(result).toEqual({});
  });

  it("should handle empty string values", () => {
    const formData = new FormData();
    formData.append("name", "");
    formData.append("description", "");

    const result = parseFormData(formData);

    expect(result).toEqual({
      name: "",
      description: "",
    });
  });

  it("should handle numeric string values", () => {
    const formData = new FormData();
    formData.append("count", "42");
    formData.append("price", "99.99");

    const result = parseFormData(formData);

    expect(result).toEqual({
      count: "42",
      price: "99.99",
    });
  });

  it("should handle boolean-like string values", () => {
    const formData = new FormData();
    formData.append("isActive", "true");
    formData.append("isPublic", "false");

    const result = parseFormData(formData);

    expect(result).toEqual({
      isActive: "true",
      isPublic: "false",
    });
  });

  it("should handle sparse arrays", () => {
    const formData = new FormData();
    formData.append("items[0]", "first");
    formData.append("items[5]", "sixth");
    formData.append("items[10]", "eleventh");

    const result = parseFormData(formData);

    expect(result).toEqual({
      items: [
        "first",
        undefined,
        undefined,
        undefined,
        undefined,
        "sixth",
        undefined,
        undefined,
        undefined,
        undefined,
        "eleventh",
      ],
    });
  });

  it("should handle arrays with nested objects and arrays", () => {
    const formData = new FormData();
    formData.append("posts[0].title", "Post 1");
    formData.append("posts[0].tags[0]", "tech");
    formData.append("posts[0].tags[1]", "javascript");
    formData.append("posts[1].title", "Post 2");
    formData.append("posts[1].tags[0]", "design");

    const result = parseFormData(formData);

    expect(result).toEqual({
      posts: [
        {
          title: "Post 1",
          tags: ["tech", "javascript"],
        },
        {
          title: "Post 2",
          tags: ["design"],
        },
      ],
    });
  });

  it("should handle keys with nested array notation (treated as literal keys)", () => {
    // Note: The function treats "matrix[0][1]" as a literal key name,
    // not as nested arrays. For nested arrays, use dot notation like "matrix.0.1"
    const formData = new FormData();
    formData.append("matrix[0][0]", "a");
    formData.append("matrix[0][1]", "b");
    formData.append("matrix[1][0]", "c");
    formData.append("matrix[1][1]", "d");

    const result = parseFormData(formData);

    // The function parses "matrix[0][0]" as: array key "matrix[0]" with index 0
    expect(result).toEqual({
      "matrix[0]": ["a", "b"],
      "matrix[1]": ["c", "d"],
    });
  });

  it("should handle complex real-world form structure", () => {
    const formData = new FormData();
    formData.append("title", "Product Form");
    formData.append("product.name", "Widget");
    formData.append("product.price", "29.99");
    formData.append("product.categories[0]", "Electronics");
    formData.append("product.categories[1]", "Gadgets");
    formData.append("product.variants[0].color", "red");
    formData.append("product.variants[0].size", "large");
    formData.append("product.variants[1].color", "blue");
    formData.append("product.variants[1].size", "medium");
    formData.append("metadata.author", "John Doe");
    formData.append("metadata.created", "2024-01-01");

    const result = parseFormData(formData);

    expect(result).toEqual({
      title: "Product Form",
      product: {
        name: "Widget",
        price: "29.99",
        categories: ["Electronics", "Gadgets"],
        variants: [
          { color: "red", size: "large" },
          { color: "blue", size: "medium" },
        ],
      },
      metadata: {
        author: "John Doe",
        created: "2024-01-01",
      },
    });
  });

  it("should overwrite values when same key is used multiple times", () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("name", "Jane");

    const result = parseFormData(formData);

    // FormData.entries() returns all entries, so both should be processed
    // The last one should win
    expect(result.name).toBe("Jane");
  });

  it("should handle File objects in FormData", () => {
    const formData = new FormData();
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    formData.append("file", file);
    formData.append("name", "test");

    const result = parseFormData(formData);

    expect(result.name).toBe("test");
    expect(result.file).toBeInstanceOf(File);
    expect((result.file as File).name).toBe("test.txt");
  });

  it("should handle keys with special characters in array notation", () => {
    const formData = new FormData();
    formData.append("items[0]", "value1");
    formData.append("items-with-dash[0]", "value2");
    formData.append("items_with_underscore[0]", "value3");

    const result = parseFormData(formData);

    expect(result).toEqual({
      items: ["value1"],
      "items-with-dash": ["value2"],
      items_with_underscore: ["value3"],
    });
  });

  it("should handle deeply nested paths", () => {
    const formData = new FormData();
    formData.append("a.b.c.d.e.f", "deep value");

    const result = parseFormData(formData);

    expect(result).toEqual({
      a: {
        b: {
          c: {
            d: {
              e: {
                f: "deep value",
              },
            },
          },
        },
      },
    });
  });

  it("should handle array index at the end of nested path", () => {
    const formData = new FormData();
    formData.append("user.settings[0]", "setting1");
    formData.append("user.settings[1]", "setting2");

    const result = parseFormData(formData);

    expect(result).toEqual({
      user: {
        settings: ["setting1", "setting2"],
      },
    });
  });

  it("should handle array index in the middle of nested path", () => {
    const formData = new FormData();
    formData.append("users[0].profile.name", "John");
    formData.append("users[0].profile.email", "john@example.com");
    formData.append("users[1].profile.name", "Jane");
    formData.append("users[1].profile.email", "jane@example.com");

    const result = parseFormData(formData);

    expect(result).toEqual({
      users: [
        {
          profile: {
            name: "John",
            email: "john@example.com",
          },
        },
        {
          profile: {
            name: "Jane",
            email: "jane@example.com",
          },
        },
      ],
    });
  });
});
