defmodule Operately.Data.Change094UpdateCompanyAdminBindingsToAdminAccessTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access

  test "upgrades company person bindings from edit access to admin access" do
    company = company_fixture()
    owner = Operately.Companies.list_owners(company) |> hd()

    # People in the company: two target admins + one member.
    admin_1 = person_fixture_with_account(%{company_id: company.id})
    admin_2 = person_fixture_with_account(%{company_id: company.id})
    member = person_fixture_with_account(%{company_id: company.id})

    company_context = Access.get_context!(company_id: company.id)

    # Admins with edit access.
    {:ok, _} = Access.bind(company_context, person_id: admin_1.id, level: Access.Binding.edit_access())
    {:ok, _} = Access.bind(company_context, person_id: admin_2.id, level: Access.Binding.edit_access())

    # Member with view access.
    {:ok, _} = Access.bind(company_context, person_id: member.id, level: Access.Binding.view_access())

    # Company standard group binding with comment access.
    standard_group = Access.get_group!(company_id: company.id, tag: :standard)
    standard_binding = Access.get_binding!(context_id: company_context.id, group_id: standard_group.id)
    {:ok, _} = Access.update_binding(standard_binding, %{access_level: Access.Binding.comment_access()})

    # Person binding in a non-company context.
    space = group_fixture(owner, %{company_id: company.id})
    space_context = Access.get_context!(group_id: space.id)
    {:ok, _} = Access.bind(space_context, person_id: admin_1.id, level: Access.Binding.comment_access())

    # Preconditions.
    assert person_binding_level(company_context, admin_1) == Access.Binding.edit_access()
    assert person_binding_level(company_context, admin_2) == Access.Binding.edit_access()
    assert person_binding_level(company_context, member) == Access.Binding.view_access()
    assert Access.get_binding!(context_id: company_context.id, group_id: standard_group.id).access_level == Access.Binding.comment_access()
    assert person_binding_level(space_context, admin_1) == Access.Binding.comment_access()

    # Run migration and verify only target rows changed.
    Operately.Data.Change094UpdateCompanyAdminBindingsToAdminAccess.run()

    assert person_binding_level(company_context, admin_1) == Access.Binding.admin_access()
    assert person_binding_level(company_context, admin_2) == Access.Binding.admin_access()
    assert person_binding_level(company_context, member) == Access.Binding.view_access()
    assert Access.get_binding!(context_id: company_context.id, group_id: standard_group.id).access_level == Access.Binding.comment_access()
    assert person_binding_level(space_context, admin_1) == Access.Binding.comment_access()

    # Run again to confirm idempotency.
    Operately.Data.Change094UpdateCompanyAdminBindingsToAdminAccess.run()

    assert person_binding_level(company_context, admin_1) == Access.Binding.admin_access()
    assert person_binding_level(company_context, admin_2) == Access.Binding.admin_access()
  end

  defp person_binding_level(context, person) do
    group = Access.get_group!(person_id: person.id)
    binding = Access.get_binding!(context_id: context.id, group_id: group.id)

    binding.access_level
  end
end
