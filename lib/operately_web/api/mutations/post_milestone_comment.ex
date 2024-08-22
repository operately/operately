defmodule OperatelyWeb.Api.Mutations.PostMilestoneComment do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :milestone_id, :string
    field :content, :string
    field :action, :string
  end

  outputs do
    field :comment, :milestone_comment
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.milestone_id) end)
    |> run(:milestone, fn ctx -> Projects.get_milestone_with_access_level(ctx.id, ctx.me.id) end)
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
    message = inputs.content && Jason.decode!(inputs.content)

    Operately.Comments.create_milestone_comment(
      person,
      milestone,
      inputs.action,
      %{
        content: %{"message" => message},
        author_id: person.id,
      }
    )
  end

  defp check_permissions(milestone, action) do
    case action do
      "none" -> Permissions.check(milestone.requester_access_level, :can_comment_on_milestone)
      "reopen" -> Permissions.check(milestone.requester_access_level, :can_reopen_milestone)
      "complete" -> Permissions.check(milestone.requester_access_level, :can_complete_milestone)
    end
  end
end
