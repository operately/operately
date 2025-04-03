defmodule OperatelyWeb.Api.Queries.GetProjectContributor do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Contributor
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :id, :string
    field :include_project, :boolean
  end

  outputs do
    field :contributor, :project_contributor
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:id, fn -> decode_id(inputs[:id]) end)
    |> Action.run(:contrib, fn ctx -> load(ctx, inputs) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{contributor: Serializer.serialize(ctx.contrib, level: :full)}} end)
    |> respond()
  end

  def load(ctx, inputs) do
    Contributor.get(ctx.me, id: ctx.id, opts: [preload: preloaded(inputs)])
  end

  def preloaded(inputs) do
    [:person] ++ (if inputs[:include_project], do: [:project], else: [])
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :contrib, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

end
