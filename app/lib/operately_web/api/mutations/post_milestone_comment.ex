defmodule OperatelyWeb.Api.Mutations.PostMilestoneComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :milestone_id, :id, null: false
    field :content, :json, null: true
    field :action, :string, null: false
  end

  outputs do
    field :comment, :milestone_comment, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:milestone, fn ctx -> Projects.get_milestone_with_access_level(inputs.milestone_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.milestone, inputs.action) end)
    |> run(:operation, fn ctx -> execute(ctx.me, ctx.milestone, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{comment: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :milestone, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp execute(person, milestone, inputs) do
    Operately.Comments.create_milestone_comment(
      person,
      milestone,
      inputs.action,
      %{
        content: %{"message" => inputs.content},
        author_id: person.id,
        entity_id: milestone.id,
        entity_type: :project_milestone,
      }
    )
  end

  defp check_permissions(milestone, action) do
    case action do
      "none" -> Permissions.check(milestone.requester_access_level, :can_comment)
      "reopen" -> Permissions.check(milestone.requester_access_level, :can_edit)
      "complete" -> Permissions.check(milestone.requester_access_level, :can_edit)
    end
  end
end
