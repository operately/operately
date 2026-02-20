defmodule OperatelyWeb.Api.Queries.GetProjectContributor do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Contributor
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :id, :id, null: false
    field? :include_project, :boolean, null: false
    field? :include_permissions, :boolean, null: false
    field? :include_access_level, :boolean, null: true
  end

  outputs do
    field :contributor, :project_contributor, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:contrib, fn ctx -> load(ctx, inputs) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{contributor: Serializer.serialize(ctx.contrib, level: :full)}} end)
    |> respond()
  end

  defp load(ctx, inputs) do
    Contributor.get(ctx.me, id: inputs.id, opts: [preload: preload(inputs), after_load: after_load(inputs)])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs,
      include_project: [:project],
      always_include: [:person]
    )
  end

  defp after_load(inputs) do
    Inputs.parse_includes(inputs,
      include_permissions: &Contributor.set_permissions/1,
      include_access_level: &Contributor.load_access_level/1
    )
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :contrib, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end
end
