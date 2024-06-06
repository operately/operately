defmodule Operately.Support.Features.InviteMemberSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI

  step :navigate_to_invitation_page, ctx do
    ctx
    |> UI.visit("/")
    |> UI.click(testid: "go-to-admin")
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

  step :change_password, ctx, password do
    ctx
    |> UI.fill(testid: "password", with: password)
    |> UI.fill(testid: "password-confirmation", with: password)
    |> UI.click(testid: "submit-form")
  end

  step :reissue_invitation_token, ctx, params do
    ctx
    |> UI.click(testid: params[:newTokenTestId])

  end

  step :assert_member_invited, ctx do
    ctx
    |> UI.assert_text("Share this url with the new member:")
    |> UI.assert_text("/first-time-login?token=")
  end

  step :assert_wrong_password, ctx, params do
    account = Operately.People.get_account_by_email_and_password(params[:email], params[:password])

    assert account == nil

    ctx
  end

  step :assert_password_changed, ctx, params do
    account = Operately.People.get_account_by_email_and_password(params[:email], params[:password])
    account = Operately.Repo.preload(account, :person)

    assert is_struct(account, Operately.People.Account)
    assert account.person.full_name == params[:fullName]

    ctx
  end
end
