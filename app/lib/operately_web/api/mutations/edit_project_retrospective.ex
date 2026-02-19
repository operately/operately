defmodule OperatelyWeb.Api.Mutations.EditProjectRetrospective do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Retrospective, Permissions}
  alias Operately.Operations.ProjectRetrospectiveEditing

  inputs do
    field :id, :id
    field :content, :string
    field :success_status, :string
  end

  outputs do
    field :retrospective, :project_retrospective
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:retrospective, fn ctx -> load(inputs.id, ctx.me) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.retrospective.request_info.access_level, :can_edit) end)
    |> run(:operation, fn ctx -> ProjectRetrospectiveEditing.run(ctx.me, ctx.retrospective, ctx.attrs)  end)
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

  defp load(id, me) do
    Retrospective.get(me, id: id, opts: [
      preload: :project,
    ])
  end

  defp parse_inputs(inputs) do
    {:ok, %{
      id: inputs.id,
      content: Jason.decode!(inputs.content),
      success_status: String.to_atom(inputs.success_status),
    }}
  end
end
