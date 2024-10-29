defmodule OperatelyWeb.Api.Mutations.EditCompany do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Companies.Permissions
  alias Operately.Operations.CompanyEditing

  inputs do
    field :name, :string
  end

  outputs do
    field :company, :company
  end

  def call(conn, inputs) do
    me = find_me(conn) |> unwrap()
    company = Company.get(me, id: me.company_id) |> unwrap()

    authorize(company, :can_edit_details)
    
    company = CompanyEditing.run(me, company, inputs.name) |> unwrap()
    serialized = Serializer.serialize(company, level: :essential)

    {:ok, %{company: serialized}}
  catch
    {:error, :forbidden} -> {:error, :forbidden}
    {:error, :not_found} -> {:error, :not_found}
    {:error, _} -> {:error, :internal_server_error}
  end

  defp authorize(company, action) do
    access_level = company.request_info.access_level

    case Permissions.check(access_level, action) do
      {:ok, :allowed} -> :ok
      {:error, _} -> throw {:error, :forbidden}
    end
  end

  defp unwrap({:ok, value}), do: value
  defp unwrap({:error, :not_found}), do: throw {:error, :not_found}
  defp unwrap({:error, :forbidden}), do: throw {:error, :forbidden}
  defp unwrap({:error, _}), do: throw {:error, :internal_server_error}

end
