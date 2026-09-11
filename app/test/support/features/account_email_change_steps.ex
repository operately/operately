defmodule Operately.Support.Features.AccountEmailChangeSteps do
  use Operately.FeatureCase
  import Ecto.Query
  alias Operately.People.{EmailChange, EmailChangeRequest}

  step :setup, ctx do
    ctx |> Factory.setup() |> Factory.log_in_person(:creator)
  end

  step :open_email_settings, ctx do
    ctx
    |> UI.visit(Paths.account_security_path(ctx.company))
    |> UI.click(testid: "change-email")
    |> UI.assert_has(testid: "email-change-entry")
  end

  step :request_code, ctx, email do
    ctx =
      ctx
      |> UI.fill(testid: "new-email", with: email)
      |> UI.click(testid: "submit-email-change")
      |> UI.assert_has(testid: "email-change-verification")

    assert_receive {:email, %Swoosh.Email{subject: "Operately email change code: " <> code}}, 5000
    request = EmailChange.state(ctx.account).pending
    Map.merge(ctx, %{new_email: email, code: code, request: request})
  end

  step :assert_email_unchanged, ctx do
    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert Repo.reload!(ctx.creator).email == ctx.account.email
    ctx
  end

  step :reload_verification, ctx do
    ctx
    |> UI.visit(Paths.account_security_path(ctx.company) <> "/change-email")
    |> UI.assert_has(testid: "email-change-verification")
  end

  step :confirm_code, ctx do
    ctx
    |> UI.fill(testid: "verification-code", with: String.downcase(ctx.code))
    |> UI.click(testid: "submit-email-change")
    |> UI.assert_has(testid: "email-change-success")
  end

  step :assert_email_changed, ctx do
    assert Repo.reload!(ctx.account).email == ctx.new_email
    assert Repo.reload!(ctx.creator).email == ctx.new_email
    assert_email_sent(to: ctx.account.email, subject: "Your Operately email has changed")
    ctx
  end

  step :assert_account_display_updated, ctx do
    ctx
    |> UI.visit(Paths.account_path(ctx.company))
    |> UI.assert_has(testid: "my-account-page")
    |> UI.assert_text(ctx.new_email)
  end

  step :change_destination, ctx do
    ctx = ctx |> UI.click(testid: "change-email-destination") |> UI.assert_has(testid: "email-change-entry")
    assert Repo.reload!(ctx.request).invalidated_at
    ctx
  end

  step :allow_another_send, ctx do
    sent_at = DateTime.utc_now() |> DateTime.add(-61) |> DateTime.truncate(:second)
    Repo.update_all(from(r in EmailChangeRequest, where: r.account_id == ^ctx.account.id), set: [sent_at: sent_at])
    ctx |> UI.visit(Paths.account_security_path(ctx.company) <> "/change-email")
  end

  step :cancel_change, ctx do
    ctx = ctx |> UI.click(testid: "cancel-email-change") |> UI.assert_has(testid: "account-security-page")
    assert is_nil(EmailChange.state(ctx.account).pending)
    ctx
  end

  step :enter_wrong_code, ctx do
    wrong_code = if ctx.code == "AAA-AAA", do: "BBBBBB", else: "AAAAAA"

    ctx
    |> UI.fill(testid: "verification-code", with: wrong_code)
    |> UI.click(testid: "submit-email-change")
    |> UI.assert_has(testid: "email-change-error")
  end

  step :expire_code, ctx do
    expired_at = DateTime.utc_now() |> DateTime.add(-1) |> DateTime.truncate(:second)
    ctx.request |> Ecto.Changeset.change(expires_at: expired_at) |> Repo.update!()
    ctx |> allow_another_send() |> UI.assert_has(testid: "email-change-code-unavailable")
  end

  step :resend_code, ctx do
    ctx = ctx |> UI.click(testid: "resend-email-code") |> UI.assert_has(testid: "resend-countdown")
    assert_receive {:email, %Swoosh.Email{subject: "Operately email change code: " <> code}}, 5000
    assert Repo.reload!(ctx.request).invalidated_at
    Map.put(ctx, :code, code)
  end

  step :use_mobile_viewport, ctx do
    Map.update!(ctx, :session, &Wallaby.Browser.resize_window(&1, 390, 844))
  end
end
