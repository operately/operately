defmodule Operately.Operations.CompanyAddingTest do
  use Operately.DataCase

  alias Operately.Companies
  alias Operately.Groups
  alias Operately.People
  alias Operately.Access

  @email "john@your-company.com"

  @company_attrs %{
    :company_name => "Acme Co.",
    :full_name => "John Doe",
    :email => @email,
    :role => "CEO",
    :password => "Aa12345#&!123",
    :password_confirmation => "Aa12345#&!123"
  }

  test "CompanyAdding operation creates company without admin" do
    assert 0 == Companies.count_companies()

    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    assert 1 == Companies.count_companies()
    assert nil != Companies.get_company_by_name("Acme Co.")
    assert [] == People.list_people(company.id)
  end

  test "CompanyAdding operation creates company with admin" do
    assert 0 == Companies.count_companies()

    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs, create_admin: true)
    person = People.get_person_by_email(company, @email)

    assert 1 == Companies.count_companies()
    assert nil != Companies.get_company_by_name("Acme Co.")

    assert 1 == length(People.list_people(company.id))
    assert person.company_role == :admin
    assert person.full_name == "John Doe"
    assert person.title == "CEO"

    assert nil != People.get_account_by_email(@email)
  end

  test "CompanyAdding operation creates company group" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    assert nil != company.company_space_id
    assert nil != Groups.get_group(company.company_space_id)
  end


  test "CompanyAdding operation creates admin user's access group and membership" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs, create_admin: true)

    person = People.get_person_by_email(company, @email)
    group = Access.get_group!(person_id: person.id)

    assert nil != group
    assert nil != Access.get_group_membership(group_id: group.id, person_id: person.id)
  end

  test "CompanyAdding operation creates access groups, bindings and group_memberships for admins and members" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs, create_admin: true)

    person = People.get_person_by_email(company, @email)
    full_access = Access.get_group!(company_id: company.id, tag: :full_access)
    standard = Access.get_group!(company_id: company.id, tag: :standard)
    anonymous = Access.get_group!(company_id: company.id, tag: :anonymous)

    assert nil != full_access
    assert nil != standard
    assert nil != anonymous

    assert nil != Access.get_binding!(group_id: full_access.id, access_level: 100)
    assert nil != Access.get_binding!(group_id: standard.id, access_level: 10)

    assert nil != Access.get_group_membership(group_id: full_access.id, person_id: person.id)
    assert nil == Access.get_group_membership(group_id: standard.id, person_id: person.id)
  end

  test "CompanyAdding operation creates company and group access contexts" do
    {:ok, company} = Operately.Operations.CompanyAdding.run(@company_attrs)

    assert nil != Access.get_context!(company_id: company.id)
    assert nil != Access.get_context!(group_id: company.company_space_id)
  end
end
