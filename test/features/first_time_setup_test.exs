defmodule Operately.Features.FirstTimeSetupTest do
  use Operately.FeatureCase
  import Operately.CompaniesFixtures

  alias Operately.Support.Features.UI

  @company_info %{
    :companyName => "Acme Co.",
    :fullName => "John Doe",
    :email => "john@your-company.com",
    :role => "CEO",
    :password => "Aa12345#&!123",
    :passwordConfirmation => "Aa12345#&!123"
  }

  feature "redirects to /first-time-setup", ctx do
    ctx
    |> UI.visit("/")
    |> UI.assert_page("/first-time-setup")

    ctx
    |> UI.visit("/people")
    |> UI.assert_page("/first-time-setup")
  end

  feature "redirects from /first-time-setup", ctx do
    company_fixture(%{name: "Test Company"})

    ctx
    |> UI.visit("/first-time-setup")
    |> UI.assert_page("/accounts/log_in")
  end

  feature "create company and admin account", ctx do
    ctx
    |> UI.visit("/")
    |> UI.assert_page("/first-time-setup")
    |> UI.assert_text("Welcome to Operately!")
    |> UI.fill(testid: "company-name", with: @company_info[:companyName])
    |> UI.fill(testid: "full-name", with: @company_info[:fullName])
    |> UI.fill(testid: "email", with: @company_info[:email])
    |> UI.fill(testid: "role", with: @company_info[:role])
    |> UI.fill(testid: "password", with: @company_info[:password])
    |> UI.fill(testid: "password-confirmation", with: @company_info[:passwordConfirmation])
    |> UI.click(testid: "submit-form")
    |> UI.assert_page("/accounts/log_in")

    account = Operately.People.get_account_by_email_and_password(@company_info[:email], @company_info[:password])

    assert Operately.Companies.count_companies() == 1
    assert account != nil

    account = Operately.Repo.preload(account, :person)

    assert account.person.company_role == :admin
  end
end
