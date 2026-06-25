defmodule OperatelyWeb.Mcp.InputValidatorTest do
  use ExUnit.Case, async: true

  alias OperatelyWeb.Mcp.Catalog.JsonSchema
  alias OperatelyWeb.Mcp.InputValidator

  test "accepts valid arguments for the supported schema subset" do
    schema =
      JsonSchema.object(
        %{
          "query" => JsonSchema.string("Search query."),
          "include_archived" => JsonSchema.boolean("Include archived projects."),
          "url" => JsonSchema.string("Canonical URL.", format: "uri")
        },
        required: ["query", "url"]
      )

    assert :ok ==
             InputValidator.validate(schema, %{
               "query" => "roadmap",
               "include_archived" => true,
               "url" => "https://app.operately.com/acme/projects/project_123"
             })
  end

  test "rejects missing required keys" do
    schema =
      JsonSchema.object(
        %{
          "query" => JsonSchema.string("Search query.")
        },
        required: ["query"]
      )

    assert {:error, {:missing_required_key, "query"}} == InputValidator.validate(schema, %{})
  end

  test "rejects unexpected keys when additional properties are disabled" do
    schema = JsonSchema.object(%{"query" => JsonSchema.string("Search query.")})

    assert {:error, {:unexpected_key, "extra"}} ==
             InputValidator.validate(schema, %{"query" => "roadmap", "extra" => true})
  end

  test "rejects wrong primitive types" do
    schema = JsonSchema.object(%{"include_archived" => JsonSchema.boolean("Include archived projects.")})

    assert {:error, {:invalid_type, "include_archived", "boolean"}} ==
             InputValidator.validate(schema, %{"include_archived" => "true"})
  end

  test "rejects invalid uri formats" do
    schema = JsonSchema.object(%{"url" => JsonSchema.string("Canonical URL.", format: "uri")})

    assert {:error, {:invalid_format, "url", "uri"}} ==
             InputValidator.validate(schema, %{"url" => "not-a-uri"})
  end

  test "rejects invalid enum values" do
    schema =
      JsonSchema.object(%{
        "status" => JsonSchema.string("Check-in status.", enum: ["on_track", "caution", "off_track"])
      })

    assert {:error, {:invalid_enum, "status"}} ==
             InputValidator.validate(schema, %{"status" => "blocked"})
  end
end
