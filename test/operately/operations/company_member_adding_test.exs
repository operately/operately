defmodule Operately.Operations.CompanyMemberAddingTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.People
  alias Operately.People.Person
  alias Operately.Groups
  alias Operately.Invitations
  alias Operately.Invitations.Invitation
  alias Operately.Activities.Activity

  @email "john@your-company.com"

  @member_attrs %{
    :full_name => "John Doe",
    :email => @email,
    :title => "Developer",
  }

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, admin: admin}
  end

  test "CompanyMemberAdding operation creates person", ctx do
    assert Repo.aggregate(Person, :count, :id) == 2 # company creator + company admin

    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

    assert Repo.aggregate(Person, :count, :id) == 3 # company creator + company admin + new member
    assert People.get_account_by_email(@email)

    person = People.get_person_by_email(ctx.company, @email)

    assert person.full_name == "John Doe"
    assert person.title == "Developer"
    assert person.has_open_invitation
  end

  test "CompanyMemberAdding operation creates members's access group and membership", ctx do
    Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

    person = People.get_person_by_email(ctx.company, @email)
    group = Access.get_group!(person_id: person.id)

    assert Access.get_group_membership(group_id: group.id, person_id: person.id)

    company_group = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    assert Access.get_group_membership(group_id: company_group.id, person_id: person.id)
  end

  test "CompanyMemberAdding operation creates invitation for person", ctx do
    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

    person = People.get_person_by_email(ctx.company, @email)

    assert Repo.aggregate(Invitation, :count, :id) == 1
    assert Invitations.get_invitation_by_member(person)
  end

  test "CompanyMemberAdding operation creates company space member", ctx do
    company_space = Groups.get_group!(ctx.company.company_space_id)

    assert length(Groups.list_members(company_space)) == 1 # company creator

    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

    assert length(Groups.list_members(company_space)) == 2 # company creator + new member
  end

  test "CompanyMemberAdding operation creates activity", ctx do
    {:ok, invitation} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

    activity = from(a in Activity, where: a.action == "company_member_added" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert activity.content["invitatition_id"] == invitation.id
    assert activity.content["name"] == "John Doe"
    assert activity.content["email"] == @email
    assert activity.content["title"] == "Developer"
  end
end
