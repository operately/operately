defmodule OperatelyWeb.Api.Mutations.GrantResourceAccess do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  require Logger
  alias Operately.Access.Filters

  inputs do
    field :person_id, :string, null: false
    field :resources, list_of(:resource_access_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    {:ok, me} = find_me(conn)

    if admin_has_edit_access?(me) do
      process_grant(inputs)
    else
      {:error, :forbidden}
    end
  end

  defp admin_has_edit_access?(me) do
    from(c in Operately.Companies.Company, where: c.id == ^me.company_id)
    |> Filters.filter_by_admin_access(me.id)
    |> Repo.exists?()
  end

  defp process_grant(inputs) do
    case Operately.Operations.ResourceAccessGranting.run(inputs.person_id, inputs.resources) do
      {:ok, _} ->
        {:ok, %{success: true}}

      {:error, _, changeset, _} ->
        Logger.error("Failed to grant resource access: #{inspect(changeset)}")
        {:error, :internal_server_error}

      {:error, error} ->
        Logger.error("Failed to grant resource access: #{inspect(error)}")
        {:error, :internal_server_error}
    end
  end
end
