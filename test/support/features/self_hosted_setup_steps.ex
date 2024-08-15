defmodule Operately.Support.Features.SelfHostedSetupSteps do
  use Operately.FeatureCase

  # import Operately.CompaniesFixtures
  alias Operately.Support.Features.UI

  step :open_operately, ctx do
    ctx |> UI.visit("/")
  end

  step :assert_on_the_setup_page, ctx do
    ctx 
    |> UI.assert_page("/setup")
    |> UI.assert_text("Welcome to Operately!")
  end

  step :fill_out_setup_form, ctx, company_info do
    ctx
    |> UI.fill(testid: "company-name", with: company_info[:company_name])
    |> UI.fill(testid: "full-name", with: company_info[:full_name])
    |> UI.fill(testid: "email", with: company_info[:email])
    |> UI.fill(testid: "title", with: company_info[:title])
    |> UI.fill(testid: "password", with: company_info[:password])
    |> UI.fill(testid: "password-confirmation", with: company_info[:password_confirmation])
  end
  
  step :submit_setup_form, ctx do
    ctx |> UI.click(testid: "submit-form")
  end

  step :assert_account_and_company_created, ctx, company_info do
    account = Operately.People.get_account_by_email_and_password(company_info[:email], company_info[:password])

    assert Operately.Companies.count_companies() == 1
    assert account != nil

    person = Operately.Repo.preload(account, :people).people |> hd()

    assert person.company_role == :admin

    ctx
  end

  step :assert_on_company_home, ctx do
    ctx |> UI.assert_has(testid: "company-home")
  end

  step :assert_setup_page_is_no_longer_accessible, ctx do
    ctx 
    |> UI.visit("/setup") 
    |> UI.assert_has(testid: "company-home")
  end
end
