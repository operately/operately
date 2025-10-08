defmodule Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpace do
  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Access, Companies}
  alias Operately.Companies.Company
  alias Operately.Access.Binding

  def run do
    Repo.transaction(fn ->
      companies = list_companies()

      create_bindings(companies)
      create_memberships(companies)
    end)
  end

  defp list_companies do
    from(c in Company, select: [:id, :company_space_id], preload: :people)
    |> Repo.all()
  end

  defp create_bindings(companies) when is_list(companies) do
    Enum.each(companies, &create_bindings/1)
  end

  defp create_bindings(company = %Company{}) do
    company_space = Companies.get_company_space!(company.id)
    context = Access.get_context!(group_id: company_space.id)

    Enum.each(company.people, fn p ->
      group = Access.get_group!(person_id: p.id)
      create_binding(group.id, context.id)
    end)
  end

  defp create_binding(group_id, context_id) do
    case Access.get_binding(group_id: group_id, context_id: context_id) do
      nil ->
        {:ok, _} =
          Access.create_binding(%{
            group_id: group_id,
            context_id: context_id,
            access_level: Binding.edit_access()
          })

      _ ->
        :ok
    end
  end

  defp create_memberships(companies) when is_list(companies) do
    Enum.each(companies, &create_memberships/1)
  end

  defp create_memberships(company = %Company{}) do
    space = Companies.get_company_space!(company.id)
    group = Access.get_group!(group_id: space.id, tag: :standard)

    Enum.each(company.people, fn p ->
      create_membership(p.id, group.id)
    end)
  end

  defp create_membership(person_id, group_id) do
    case Access.get_group_membership(person_id: person_id, group_id: group_id) do
      nil ->
        {:ok, _} =
          Access.create_group_membership(%{
            person_id: person_id,
            group_id: group_id
          })

      _ ->
        :ok
    end
  end
end
