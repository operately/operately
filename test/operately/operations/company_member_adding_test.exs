defmodule Operately.Operations.CompanyMemberAddingTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.People
  alias Operately.People.Person
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
    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})

    {:ok, company: company, admin: admin}
  end

  test "CompanyMemberAdding operation creates person", ctx do
    assert 1 == Repo.aggregate(Person, :count, :id)

    Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

    assert 2 == Repo.aggregate(Person, :count, :id)
    assert nil != People.get_account_by_email(@email)

    person = People.get_person_by_email(ctx.company, @email)

    assert person.company_role == :member
    assert person.full_name == "John Doe"
    assert person.title == "Developer"
  end

  test "CompanyMemberAdding operation creates invitation for person", ctx do
    Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

    person = People.get_person_by_email(ctx.company, @email)

    assert 1 == Repo.aggregate(Invitation, :count, :id)
    assert nil != Invitations.get_invitation_by_member(person)
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
