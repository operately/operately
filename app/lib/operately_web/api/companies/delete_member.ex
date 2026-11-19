defmodule OperatelyWeb.Api.Companies.DeleteMember do
  @moduledoc """
  Removes a member from a company.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies
  alias Operately.Companies.Permissions
  alias Operately.Operations.CompanyMemberRemoving
  alias Operately.People.Person

  inputs do
    field :person_id, :id, null: false
  end

  outputs do
    field :person, :person, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company, fn ctx -> Companies.get_company_with_access_level(ctx.me.id, id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.company.requester_access_level, :can_remove_members, company_read_only: company_read_only(conn)) end)
    |> run(:person, fn ctx -> find_person(ctx.company.id, inputs.person_id) end)
    |> run(:operation, fn ctx -> CompanyMemberRemoving.run(ctx.me, ctx.person) end)
    |> run(:serialized, fn ctx -> {:ok, %{person: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  # Loads the removal target within the authorized company only, so that
  # people from other companies cannot be removed and their existence
  # is not disclosed. Suspended members remain loadable, as removing
  # them is a legitimate lifecycle action.
  defp find_person(company_id, person_id) do
    case Repo.get_by(Person, id: person_id, company_id: company_id) do
      nil -> {:error, :not_found}
      person -> {:ok, person}
    end
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :person, _} -> {:error, :not_found}
      {:error, :operation, %{error: :invalid_company}} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
