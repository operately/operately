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

    assert_receive {:email, %Swoosh.Email{subject: "Operately current email verification code: " <> code}}, 5000
    request = EmailChange.state(ctx.account).pending
    Map.merge(ctx, %{new_email: email, code: code, request: request})
  end

  step :verify_current_inbox, ctx do
    assert ctx.request.stage == :current_email

    ctx =
      ctx
      |> UI.fill(testid: "verification-code", with: String.downcase(ctx.code))
      |> UI.click(testid: "submit-email-change")
      |> UI.assert_has(testid: "email-change-verification")

    assert_receive {:email, %Swoosh.Email{to: [{_, destination}], subject: "Operately email change code: " <> code}}, 5000
    assert destination == ctx.new_email
    request = EmailChange.state(ctx.account).pending
    assert request.stage == :new_email
    ctx = UI.assert_has(ctx, testid: "email-change-new-inbox")
    Map.merge(ctx, %{code: code, request: request})
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
    assert_receive {:email, %Swoosh.Email{subject: subject}}, 5000
    [_, code] = Regex.run(~r/([A-Z0-9]{3}-[A-Z0-9]{3})$/, subject)
    assert Repo.reload!(ctx.request).invalidated_at
    Map.merge(ctx, %{code: code, request: EmailChange.state(ctx.account).pending})
  end

  step :expire_authorization, ctx do
    verified_at = DateTime.utc_now() |> DateTime.add(-601) |> DateTime.truncate(:second)
    ctx.request |> Ecto.Changeset.change(current_email_verified_at: verified_at) |> Repo.update!()
    ctx |> allow_another_send() |> UI.assert_has(testid: "restart-email-change")
  end

  step :restart_verification, ctx do
    ctx |> UI.click(testid: "restart-email-change") |> UI.assert_has(testid: "email-change-entry")
  end

  step :use_mobile_viewport, ctx do
    Map.update!(ctx, :session, &Wallaby.Browser.resize_window(&1, 390, 844))
  end
end
