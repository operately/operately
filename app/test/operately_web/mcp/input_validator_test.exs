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

  test "accepts string arrays" do
    schema =
      JsonSchema.object(%{
        "assignee_ids" => JsonSchema.array(JsonSchema.string("A person identifier."))
      })

    assert :ok == InputValidator.validate(schema, %{"assignee_ids" => ["person_123", "person_456"]})
    assert :ok == InputValidator.validate(schema, %{"assignee_ids" => []})

    assert {:error, {:invalid_type, "assignee_ids", "array"}} ==
             InputValidator.validate(schema, %{"assignee_ids" => "person_123"})
  end

  test "accepts integers and rejects floats" do
    schema = JsonSchema.object(%{"index" => JsonSchema.integer("Zero-based index.", minimum: 0)})

    assert :ok == InputValidator.validate(schema, %{"index" => 0})
    assert {:error, {:invalid_type, "index", "integer"}} == InputValidator.validate(schema, %{"index" => 1.5})
    assert {:error, {:invalid_minimum, "index", 0}} == InputValidator.validate(schema, %{"index" => -1})
  end

  test "accepts nullable values" do
    schema = JsonSchema.object(%{"description" => JsonSchema.nullable(JsonSchema.string("Description."))})

    assert :ok == InputValidator.validate(schema, %{"description" => nil})
    assert :ok == InputValidator.validate(schema, %{"description" => "Updated"})
  end

  test "recursively validates nested objects" do
    schema =
      JsonSchema.object(%{
        "reminder" =>
          JsonSchema.object(
            %{
              "type" => JsonSchema.string("Reminder type.", enum: ["before_due", "due_day"]),
              "days" => JsonSchema.nullable(JsonSchema.integer("Days before due.", minimum: 1))
            },
            required: ["type"]
          )
      })

    assert :ok == InputValidator.validate(schema, %{"reminder" => %{"type" => "before_due", "days" => 2}})

    assert {:error, {:missing_required_key, "reminder.type"}} ==
             InputValidator.validate(schema, %{"reminder" => %{"days" => 2}})

    assert {:error, {:unexpected_key, "reminder.extra"}} ==
             InputValidator.validate(schema, %{"reminder" => %{"type" => "due_day", "extra" => true}})

    assert {:error, {:invalid_enum, "reminder.type"}} ==
             InputValidator.validate(schema, %{"reminder" => %{"type" => "later"}})
  end

  test "recursively validates arrays of objects" do
    schema =
      JsonSchema.object(%{
        "reminders" =>
          JsonSchema.array(
            JsonSchema.object(
              %{
                "type" => JsonSchema.string("Reminder type."),
                "days" => JsonSchema.integer("Days before due.")
              },
              required: ["type"]
            )
          )
      })

    assert :ok == InputValidator.validate(schema, %{"reminders" => [%{"type" => "due_day", "days" => 0}]})

    assert {:error, {:invalid_type, "reminders[0].days", "integer"}} ==
             InputValidator.validate(schema, %{"reminders" => [%{"type" => "before_due", "days" => "two"}]})

    assert {:error, {:missing_required_key, "reminders[0].type"}} ==
             InputValidator.validate(schema, %{"reminders" => [%{"days" => 2}]})
  end
end
