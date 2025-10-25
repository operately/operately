defmodule OperatelyWeb.Api.Mutations.UpdateProfilePicture do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :person_id, :string, null: false
    field? :avatar_blob_id, :string, null: true
    field? :avatar_url, :string, null: true
  end

  outputs do
    field :person, :person, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:inputs, fn -> decode_inputs(inputs) end)
    |> run(:person, fn ctx -> Operately.People.get_person_with_access_level(ctx.inputs.person_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Operately.People.Permissions.check(ctx.person.requester_access_level, :can_edit_profile) end)
    |> run(:updated_person, fn ctx -> update_picture(ctx.person, ctx.inputs) end)
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
    with {:ok, person_id} <- decode_id(inputs[:person_id]),
         {:ok, avatar_blob_id} <- decode_id(inputs[:avatar_blob_id], :allow_nil) do
      {:ok, Map.merge(inputs, %{person_id: person_id, avatar_blob_id: avatar_blob_id})}
    end
  end

  defp update_picture(person, inputs) do
    with {:ok, _} <- maybe_mark_blob_uploaded(inputs.avatar_blob_id),
         {:ok, person} <- Operately.People.update_person(person, Map.take(inputs, [:avatar_blob_id, :avatar_url])) do
      OperatelyWeb.Api.Subscriptions.ProfileUpdated.broadcast(person_id: person.id)
      {:ok, person}
    end
  end

  defp maybe_mark_blob_uploaded(nil), do: {:ok, nil}
  defp maybe_mark_blob_uploaded(blob_id) do
    blob = Operately.Blobs.get_blob!(blob_id)
    Operately.Blobs.update_blob(blob, %{status: :uploaded})
  end
end
