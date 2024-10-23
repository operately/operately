defmodule Operately.Operations.CompanyAddingTest do
  use Operately.DataCase

  alias Operately.Companies
  alias Operately.Groups
  alias Operately.People
  alias Operately.Access
  alias Operately.Access.Binding

  import Operately.PeopleFixtures

  @email "john@your-company.com"

  @company_attrs %{
    company_name: "Acme Co.",
    full_name: "John Doe",
    email: @email,
    title: "CEO",
    password: "Aa12345#&!123",
    password_confirmation: "Aa12345#&!123"
  }

  test "CompanyAdding operation creates company for an existing account" do
    account = account_fixture()

    assert Companies.count_companies() == 0

    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs, account)

    assert Companies.count_companies() == 1
    assert Companies.get_company_by_name("Acme Co.")
    assert length(People.list_people(company.id)) == 1

    person = People.list_people(company.id) |> hd()
    assert person.full_name == account.full_name
    assert person.title == "CEO"
  end

  test "CompanyAdding operation creates company with owner" do
    assert Companies.count_companies() == 0

    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)
    person = People.get_person_by_email(company, @email)

    assert Companies.count_companies() == 1
    assert Companies.get_company_by_name("Acme Co.")

    assert length(People.list_people(company.id)) == 1
    assert person.full_name == "John Doe"
    assert person.title == "CEO"

    assert People.get_account_by_email(@email)

    owners = Operately.Companies.list_owners(company)
    assert length(owners) == 1
    assert Enum.find(owners, fn o -> o.id == person.id end)
  end

  test "CompanyAdding operation creates company group" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    assert company.company_space_id
    assert Groups.get_group(company.company_space_id)
  end

  test "CompanyAdding operation creates admin user's access group and membership" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    person = People.get_person_by_email(company, @email)
    group = Access.get_group!(person_id: person.id)

    assert Access.get_group_membership(group_id: group.id, person_id: person.id)
  end

  test "CompanyAdding operation creates access groups, bindings and group_memberships for admins and members" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    person = People.get_person_by_email(company, @email)

    # Company
    context = Access.get_context!(company_id: company.id)
    full_access = Access.get_group!(company_id: company.id, tag: :full_access)
    standard = Access.get_group!(company_id: company.id, tag: :standard)

    assert Access.get_group(company_id: company.id, tag: :anonymous)
    assert Access.get_binding!(context_id: context.id, group_id: full_access.id, access_level: Binding.full_access())
    assert Access.get_binding!(context_id: context.id, group_id: standard.id, access_level: Binding.view_access())

    assert Access.get_group_membership(group_id: full_access.id, person_id: person.id)
    assert Access.get_group_membership(group_id: standard.id, person_id: person.id)

    # Company Space
    space = Groups.get_group!(company.company_space_id)
    full_access = Access.get_group!(group_id: space.id, tag: :full_access)
    standard = Access.get_group!(group_id: space.id, tag: :standard)

    assert Access.get_group_membership(group_id: full_access.id, person_id: person.id)
    assert Access.get_group_membership(group_id: standard.id, person_id: person.id)
  end

  test "CompanyAdding operation creates company and group access contexts" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    assert Access.get_context!(company_id: company.id)
    assert Access.get_context!(group_id: company.company_space_id)
  end

  test "CompanyAdding operation creates company company space member" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    members = Groups.get_group!(company.company_space_id) |> Groups.list_members()

    assert length(members) == 1
    assert hd(members).full_name == @company_attrs.full_name
  end
end
