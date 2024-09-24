defmodule OperatelyWeb.Api.Mutations.EditProjectRetrospective do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Retrospective, Permissions}
  alias Operately.Operations.ProjectRetrospectiveEditing

  inputs do
    field :id, :string
    field :content, :string
  end

  outputs do
    field :retrospective, :project_retrospective
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:content, fn -> parse_content(inputs.content) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:retrospective, fn ctx -> load(ctx) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.retrospective.request_info.access_level, :can_edit_retrospective) end)
    |> run(:operation, fn ctx -> ProjectRetrospectiveEditing.run(ctx.me, ctx.retrospective, ctx.content)  end)
    |> run(:serialized, fn ctx -> {:ok, %{retrospective: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :content, _} -> {:error, :bad_request}
      {:error, :retrospective, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(ctx) do
    Retrospective.get(ctx.me, id: ctx.id, opts: [
      preload: :project,
    ])
  end

  defp parse_content(content) do
    content = Jason.decode!(content)

    required_keys = ["whatCouldHaveGoneBetter", "whatDidYouLearn", "whatWentWell"]

    if Map.keys(content) -- required_keys == [] do
      {:ok, content}
    else
      {:error, nil}
    end
  end
end
