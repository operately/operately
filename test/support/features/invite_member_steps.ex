defmodule Operately.Support.Features.InviteMemberSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI

  step :navigate_to_invitation_page, ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.click(testid: "company-dropdown")
    |> UI.click(testid: "company-dropdown-company-admin")
    |> UI.click(testid: "add-remove-people-manually")
    |> UI.click(testid: "add-person")
  end

  step :invite_member, ctx, params do
    ctx
    |> UI.fill(testid: "person-full-name", with: params[:fullName])
    |> UI.fill(testid: "person-email", with: params[:email])
    |> UI.fill(testid: "person-title", with: params[:title])
    |> UI.click(testid: "submit")
  end

  step :submit_password, ctx, password do
    ctx
    |> UI.fill(testid: "password", with: password)
    |> UI.fill(testid: "password-confirmation", with: password)
    |> UI.click(testid: "submit-form")
    |> UI.sleep(300)
  end

  step :reissue_invitation_token, ctx, params do
    ctx
    |> UI.click(testid: params[:newTokenTestId])
  end

  step :assert_member_invited, ctx do
    ctx
    |> UI.assert_text("/join?token=")
  end

  step :goto_invitation_page, ctx, %{token: token} do
    ctx
    |> UI.new_session()
    |> UI.visit("/join?token=#{token}")
  end

  step :assert_invitation_form, ctx do
    ctx 
    |> UI.assert_text("Welcome to Operately")
    |> UI.assert_text("Choose a password")
    |> UI.assert_text("Repeat password")
  end

  step :assert_password_set_for_new_member, ctx, params do
    account = Operately.People.get_account_by_email_and_password(params[:email], params[:password])
    person = Operately.Repo.preload(account, :people).people |> hd()

    assert is_struct(account, Operately.People.Account)
    assert person.full_name == params[:fullName]

    ctx
  end
end
