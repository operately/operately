defmodule OperatelyWeb.Api.People.UpdatePicture do
  @moduledoc """
  Updates a person's profile picture.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.PersonPictureUpdating

  inputs do
    field :person_id, :id, null: false
    field :avatar_blob_id, :id, null: true
    field :avatar_url, :string, null: true
  end

  outputs do
    field :person, :person, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:person, fn ctx -> Operately.People.get_person_with_access_level(inputs.person_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Operately.People.Permissions.check(ctx.person.requester_access_level, :can_edit_profile, company_read_only: company_read_only(conn)) end)
    |> run(:updated_person, fn ctx -> PersonPictureUpdating.run(ctx.me, ctx.person, inputs) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{person: Serializer.serialize(ctx.updated_person, level: :essential)}}
      {:error, :me, _} -> {:error, :unauthorized}
      {:error, :inputs, _} -> {:error, :bad_request}
      {:error, :person, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :updated_person, %{error: :not_found}} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end
end
