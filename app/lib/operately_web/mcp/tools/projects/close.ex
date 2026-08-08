defmodule OperatelyWeb.Mcp.Tools.Projects.Close do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.Close, as: ProjectClose
  alias OperatelyWeb.Mcp.Helpers

  @valid_success_statuses ["achieved", "missed"]

  @impl true
  def definition do
    Definition.new!(
      name: "close_project",
      title: "Close Project",
      description: "Closes one project with a retrospective and outcome.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 131,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Close a project",
          "arguments" => %{
            "project_id" => "project_123",
            "success_status" => "achieved",
            "retrospective" => "We shipped the main scope."
          }
        },
        %{
          "title" => "Close a project and notify people",
          "arguments" => %{
            "project_id" => "project_123",
            "success_status" => "achieved",
            "retrospective" => "We shipped the main scope.",
            "notify_person_ids" => ["person_123"],
            "notify_everyone" => false
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "success_status" => JsonSchema.string("Whether the project was achieved or missed.", enum: @valid_success_statuses),
            "retrospective" => JsonSchema.string("The closing retrospective in plain text or markdown."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this close. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this project. Defaults to false."
              )
          },
          required: ["project_id", "success_status", "retrospective"]
        ),
      output_schema:
        JsonSchema.object(
          %{"retrospective" => JsonSchema.any_object("The created retrospective.")},
          required: ["retrospective"]
        )
    )
  end

  @impl true
  def call(conn, %{"project_id" => project_id, "success_status" => success_status, "retrospective" => retrospective} = arguments) do
    with {:ok, project_id} <- Helpers.decode_id(project_id),
         {:ok, success_status} <- decode_success_status(success_status),
         {:ok, retrospective} <- Helpers.markdown_to_rich_text(retrospective),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      ProjectClose.call(
        conn,
        Map.merge(
          %{
            project_id: project_id,
            success_status: success_status,
            retrospective: retrospective
          },
          notification_inputs
        )
      )
    end
  end

  defp decode_success_status("achieved"), do: {:ok, :achieved}
  defp decode_success_status("missed"), do: {:ok, :missed}
  defp decode_success_status(_), do: {:error, :invalid_arguments}
end
