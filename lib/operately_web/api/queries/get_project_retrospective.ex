defmodule OperatelyWeb.Api.Queries.GetProjectRetrospective do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Permissions, Retrospective}

  inputs do
    field :project_id, :string
    field :include_author, :boolean
    field :include_project, :boolean
    field :include_permissions, :boolean
    field :include_reactions, :boolean
  end

  outputs do
    field :retrospective, :project_retrospective
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.project_id) end)
    |> run(:retrospective, fn ctx -> load(ctx, inputs) end)
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

  defp load(ctx, inputs) do
    Retrospective.get(ctx.me, project_id: ctx.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs),
    ])
  end

  def preload(inputs) do
    OperatelyWeb.Api.Helpers.Inputs.parse_includes(inputs, [
      include_author: [:author],
      include_project: [:project],
      include_reactions: [reactions: :person],
    ])
  end

  def after_load(inputs) do
    filter_what_to_run([
      %{run: &Retrospective.set_permissions/1, if: inputs[:include_permissions]},
    ])
  end

  defp filter_what_to_run(list) do
    list
    |> Enum.filter(fn %{if: c} -> c end)
    |> Enum.map(fn %{run: f} -> f end)
  end
end
