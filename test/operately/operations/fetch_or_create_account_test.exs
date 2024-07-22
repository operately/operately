defmodule Operately.Operations.FetchOrCreateAccountTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures

  alias Operately.People
  alias Operately.Access

  @email "john@allowed_email.com"

  @attrs %{
    :name => "John Doe",
    :email => @email,
    :image => "",
  }

  setup do
    company = company_fixture(%{trusted_email_domains: ["@allowed_email.com"]})

    {:ok, company: company}
  end

  test "FetchOrCreateAccountOperation creates person and account", ctx do
    refute People.get_person_by_email(ctx.company, @email)

    Operately.People.FetchOrCreateAccountOperation.call(ctx.company, @attrs)

    person = People.get_person_by_email(ctx.company, @email)

    assert person.full_name == "John Doe"
    assert person.email == @email
    assert person.company_role == :member
    assert People.get_account_by_email(@email)
  end

  test "FetchOrCreateAccountOperation creates person's access group", ctx do
    Operately.People.FetchOrCreateAccountOperation.call(ctx.company, @attrs)

    person = People.get_person_by_email(ctx.company, @email)
    group = Access.get_group!(person_id: person.id)

    assert Access.get_group_membership(group_id: group.id, person_id: person.id)

    company_group = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    assert Access.get_group_membership(group_id: company_group.id, person_id: person.id)
  end

  test "FetchOrCreateAccountOperation doesn't create account for non-trusted email domain", ctx do
    email = "john@another_email.com"

    {:error, _} = Operately.People.FetchOrCreateAccountOperation.call(ctx.company, %{
      :name => "John Doe",
      :email => email,
      :image => "",
    })

    refute People.get_person_by_email(ctx.company, email)
  end
end
