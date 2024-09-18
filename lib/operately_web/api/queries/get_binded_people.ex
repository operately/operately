defmodule OperatelyWeb.Api.Queries.GetBindedPeople do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :resourse_type, :string
    field :resourse_id, :string
  end

  outputs do
    field :people, list_of(:person)
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:id, fn -> decode_id(inputs[:resourse_id]) end)
    |> Action.run(:access_context, fn ctx -> load_access_context(inputs[:resourse_type], ctx.id) end)
    |> Action.run(:people, fn ctx -> {:ok, Operately.Access.BindedPeopleLoader.load(ctx.access_context.id)} end)
    |> Action.run(:check_permissions, fn ctx -> check_permissions(ctx.people, me(conn)) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{people: Serializer.serialize(ctx.people, level: :essential)}} end)
    |> respond()
  end

  def load_access_context("project", id) do
    {:ok, Operately.Access.get_context!(project_id: id)}
  end

  def respond(ctx) do
    case ctx do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :inputs, _} -> {:error, :bad_request}
      {:error, :not_found, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  def check_permissions(people, me) do
    if Enum.any?(people, &(&1.id == me.id)) do
      {:ok, people}
    else
      {:error, :not_found}
    end
  end

end
