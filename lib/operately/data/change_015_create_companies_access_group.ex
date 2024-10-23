defmodule Operately.Data.Change015CreateCompaniesAccessGroup do
  alias Operately.Repo
  alias Operately.Companies
  alias Operately.Access

  def run do
    Repo.transaction(fn ->
      companies = Companies.list_companies()

      Enum.each(companies, fn company ->
        case create_groups(company.id) do
          {:error, _} -> raise "Failed to create access groups"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_groups(company_id) do
    create_group(company_id, :full_access)
    create_group(company_id, :standard)
  end

  defp create_group(company_id, tag) do
    case Access.get_group(company_id: company_id, tag: tag) do
      nil ->
        {:ok, group} = Access.create_group(%{
          company_id: company_id,
          tag: tag,
        })
        create_bindings(company_id, group, tag)

      group ->
        create_bindings(company_id, group, tag)
        :ok
    end
  end

  defp create_bindings(company_id, group, tag) do
    context = Access.get_context!(company_id: company_id)
    access_level = get_access_level(tag)

    case Access.get_binding(group_id: group.id, context_id: context.id, access_level: access_level) do
      nil -> Access.create_binding(%{
        group_id: group.id,
        context_id: context.id,
        access_level: access_level,
      })
      _ -> :ok
    end
  end

  defp get_access_level(tag) do
    case tag do
      :standard -> 10
      :full_access -> 100
    end
  end
end
