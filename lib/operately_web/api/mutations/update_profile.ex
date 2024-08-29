defmodule OperatelyWeb.Api.Mutations.UpdateProfile do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  @updatable_fields_for_oneself [:full_name, :title, :timezone, :manager_id, :theme]
  @updatable_fields_for_others [:full_name, :title, :timezone, :manager_id]

  inputs do
    field :id, :string
    field :full_name, :string
    field :title, :string
    field :timezone, :string
    field :manager_id, :string
    field :theme, :string
  end

  outputs do
    field :person, :person
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:inputs, fn -> decode_inputs(inputs) end)
    |> run(:person, fn ctx -> Operately.People.get_person_with_access_level(ctx.inputs.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Operately.People.Permissions.check(ctx.person.requester_access_level, :can_edit_profile) end)
    |> run(:updated_person, fn ctx -> update_profile(ctx.person, ctx.inputs, ctx.me.id) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{person: Serializer.serialize(ctx.updated_person, level: :essential)}}
      {:error, :me, _} -> {:error, :unauthorized}
      {:error, :inputs, _} -> {:error, :bad_request}
      {:error, :person, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp decode_inputs(inputs) do
    with {:ok, id} <- decode_id(inputs[:id]),
         {:ok, manager_id} <- decode_id(inputs[:manager_id], :allow_nil) do
      {:ok, Map.merge(inputs, %{id: id, manager_id: manager_id})}
    end
  end

  defp update_profile(person, inputs, requester_id) do
    inputs = if person.id == requester_id do
      Map.take(inputs, @updatable_fields_for_oneself)
    else
      Map.take(inputs, @updatable_fields_for_others)
    end

    {:ok, person} = Operately.People.update_person(person, inputs)

    OperatelyWeb.ApiSocket.broadcast!("api:profile_updated:#{person.id}")

    {:ok, person}
  end
end
