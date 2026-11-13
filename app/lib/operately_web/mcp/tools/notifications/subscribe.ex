defmodule OperatelyWeb.Mcp.Tools.Notifications.Subscribe do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Notifications.Subscribe, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "subscribe",
      title: "Subscribe",
      description: "Subscribes you to an accessible resource. Use the subscription-list ID from resource reads such as get_project.",
      company_mode: :authenticated,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "notifications"},
      examples: [%{"title" => "Subscribe", "arguments" => %{"subscription_list_id" => "subscription_list_123", "type" => "project_check_in"}}],
      input_schema:
        JsonSchema.object(
          %{
            "subscription_list_id" => JsonSchema.string("Subscription list id."),
            "type" =>
              JsonSchema.string("Type.",
                enum: [
                  "project_check_in",
                  "project_retrospective",
                  "goal_update",
                  "message",
                  "resource_hub_document",
                  "resource_hub_file",
                  "resource_hub_link",
                  "comment_thread",
                  "project",
                  "milestone",
                  "project_task",
                  "space_task",
                  "kpi"
                ]
              )
          },
          required: ["subscription_list_id", "type"]
        ),
      output_schema: JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, subscription_list_id} <- Helpers.decode_id(arguments["subscription_list_id"]),
         {:ok, type} <-
           Helpers.decode_enum(arguments["type"], [
             "project_check_in",
             "project_retrospective",
             "goal_update",
             "message",
             "resource_hub_document",
             "resource_hub_file",
             "resource_hub_link",
             "comment_thread",
             "project",
             "milestone",
             "project_task",
             "space_task",
             "kpi"
           ]) do
      {:ok, %{subscription_list_id: subscription_list_id, type: type}}
    end
  end
end
