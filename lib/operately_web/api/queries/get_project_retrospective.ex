defmodule OperatelyWeb.Api.Queries.GetProjectRetrospective do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Permissions

  inputs do
    field :project_id, :string
    field :include_author, :boolean
    field :include_project, :boolean
  end

  outputs do
    field :retrospective, :project_retrospective
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.project_id) end)
    |> run(:preload, fn -> include_requested(inputs) end)
    |> run(:retrospective, fn ctx -> load(ctx) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.retrospective.request_info.access_level, :can_view) end)
    |> run(:serialized, fn ctx -> {:ok, %{retrospective: Serializer.serialize(ctx.retrospective)}} end)
    |> respond()
   end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx) do
    Operately.Projects.Retrospective.get(ctx.me, project_id: ctx.id, opts: [
      preload: ctx.preload,
    ])
  end

  defp include_requested(inputs) do
    requested = extract_include_filters(inputs)

    preload =
      Enum.reduce(requested, [], fn include, result ->
        case include do
          :include_author -> [:author | result]
          :include_project-> [:project | result]
          e -> raise "Unknown include filter: #{e}"
        end
      end)

    {:ok, preload}
  end
end
