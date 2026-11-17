defmodule OperatelyWeb.Mcp.Tools.Companies.InviteGuest do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Companies.InviteGuest, as: Api
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "invite_guest",
      title: "Invite Guest",
      description: """
      Invites a guest to the connected company. Grant access to spaces, projects, or goals separately.
      """,
      company_mode: :authenticated,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "companies"},
      examples: [%{"title" => "Invite guest", "arguments" => %{"full_name" => "Alex Morgan", "email" => "alex@example.com", "title" => "Designer"}}],
      input_schema:
        JsonSchema.object(
          %{
            "full_name" => JsonSchema.string("Full name."),
            "email" => JsonSchema.string("Email."),
            "title" => JsonSchema.string("Title.")
          },
          required: ["full_name", "email", "title"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "invite_link" => JsonSchema.nullable(JsonSchema.any_object()),
            "new_account" => JsonSchema.boolean("Operation result."),
            "person_id" => JsonSchema.nullable(JsonSchema.string("Member ID."))
          },
          required: ["new_account"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, full_name} <- Inputs.string(arguments["full_name"]),
         {:ok, email} <- Inputs.string(arguments["email"]),
         {:ok, title} <- Inputs.string(arguments["title"]) do
      {:ok, %{full_name: full_name, email: email, title: title}}
    end
  end
end
