defmodule Operately.Support.Features.SignupSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI.Emails, as: Emails

  @email "michael@test.email"

  step :visit_signup_page, ctx do
    ctx |> UI.visit("/sign_up")
  end

  step :choose_signup_with_email, ctx do
    ctx |> UI.click(testid: "sign-up-with-email")
  end

  step :fill_in_details, ctx do
    ctx
    |> UI.fill(testid: "email", with: @email)
    |> UI.fill(testid: "name", with: "Michael")
    |> UI.fill(testid: "password", with: "123456789ABCder")
    |> UI.fill(testid: "confirmPassword", with: "123456789ABCder")
    |> UI.click(testid: "submit")
  end

  step :fill_in_activation_code_from_email, ctx do
    emails = Emails.wait_for_email_for(@email, attempts: 10)
    subject = hd(emails).subject
    code = String.split(subject, ": ") |> List.last()

    ctx
    |> UI.fill(testid: "code", with: code)
    |> UI.click(testid: "submit")
  end

  step :expire_original_activation_code, ctx do
    original_email = Emails.wait_for_email_for(@email, attempts: 10) |> hd()
    original_code = String.split(original_email.subject, ": ") |> List.last()
    record = Operately.Repo.get_by!(Operately.People.EmailActivationCode, email: @email, code: String.replace(original_code, "-", ""))

    record
    |> Ecto.Changeset.change(
      inserted_at: NaiveDateTime.utc_now() |> NaiveDateTime.add(-360, :second) |> NaiveDateTime.truncate(:second),
      expires_at: DateTime.utc_now() |> DateTime.add(-1, :minute) |> DateTime.truncate(:second)
    )
    |> Operately.Repo.update!()

    Map.put(ctx, :original_code, original_code)
  end

  step :resend_activation_code, ctx do
    # Advance the browser clock past the cooldown without delaying the feature test.
    Wallaby.Browser.execute_script(ctx.session, "const now = Date.now.bind(Date); Date.now = () => now() + 60000;")

    ctx
    |> UI.click(testid: "resend-email-code")
    |> UI.assert_has(Wallaby.Query.css("[data-test-id=resend-code-status][data-state=success]"))
  end

  step :fill_in_new_activation_code_from_email, ctx do
    emails = Emails.wait_for_email_for(@email, attempts: 10)
    new_email = Enum.find(emails, fn email -> not String.ends_with?(email.subject, ": " <> ctx.original_code) end)
    assert new_email, "Expected another activation email with a new code"
    code = String.split(new_email.subject, ": ") |> List.last()
    refute code == ctx.original_code

    ctx
    |> UI.fill(testid: "code", with: code)
    |> UI.click(testid: "submit")
  end

  step :assert_signup_successful, ctx do
    ctx
    |> UI.assert_has(testid: "lobby-page")
    |> UI.assert_page("/")
  end
end
