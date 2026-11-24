defmodule Operately.Support.Features.SignupSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI.Emails, as: Emails

  @email "michael@test.email"
  @resend_email "resend-signup@test.email"
  @corrected_email "corrected-signup@test.email"

  step :visit_signup_page, ctx do
    ctx |> UI.visit("/sign_up")
  end

  step :choose_signup_with_email, ctx do
    ctx |> UI.click(testid: "sign-up-with-email")
  end

  step :use_resend_email, ctx do
    Map.put(ctx, :signup_email, @resend_email)
  end

  step :fill_in_details, ctx do
    submit_details(ctx, signup_email(ctx))
  end

  step :submit_oversized_email, ctx do
    submit_details(ctx, String.duplicate("a", 244) <> "@example.com")
  end

  step :assert_oversized_email_rejected_inline, ctx do
    ctx
    |> UI.assert_page("/sign_up/email")
    |> UI.assert_has(Wallaby.Query.css("#email-error", text: "Enter an email address with no more than 255 characters."))
    |> UI.assert_has(Wallaby.Query.css("input[name=email][aria-invalid=true][aria-describedby=email-error]"))
    |> UI.assert_has(testid: "name", value: "Michael")
    |> UI.assert_has(testid: "password", value: "123456789ABCder")
    |> UI.refute_has(Wallaby.Query.css("input[name=code]"))
  end

  step :correct_oversized_email, ctx do
    ctx
    |> Map.put(:signup_email, @corrected_email)
    |> UI.fill(testid: "email", with: @corrected_email)
    |> UI.refute_has(Wallaby.Query.css("#email-error"))
    |> UI.click(testid: "submit")
  end

  step :register_email_elsewhere, ctx do
    UI.assert_has(ctx, testid: "code")
    {:ok, _} = Operately.People.Account.create("Existing User", signup_email(ctx), "ExistingPassword123")
    ctx
  end

  step :assert_final_email_error, ctx do
    ctx
    |> UI.assert_has(Wallaby.Query.css("input[name=email][aria-invalid=true]"))
    |> UI.assert_has(testid: "name", value: "Michael")
    |> UI.assert_has(testid: "password", value: "123456789ABCder")
    |> UI.refute_has(Wallaby.Query.css("input[name=code]"))
  end

  step :fill_in_activation_code_from_email, ctx do
    emails = Emails.wait_for_email_for(signup_email(ctx), attempts: 10)
    subject = hd(emails).subject
    code = String.split(subject, ": ") |> List.last()

    ctx
    |> UI.fill(testid: "code", with: code)
    |> UI.click(testid: "submit")
  end

  step :expire_original_activation_code, ctx do
    original_email = Emails.wait_for_email_for(signup_email(ctx), attempts: 10) |> hd()
    original_code = String.split(original_email.subject, ": ") |> List.last()
    record = Operately.Repo.get_by!(Operately.People.EmailActivationCode, email: signup_email(ctx), code: String.replace(original_code, "-", ""))

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
    |> UI.wait_until_has(Wallaby.Query.css("[data-test-id=resend-email-code]:not([disabled])"))
    |> UI.click(testid: "resend-email-code")
    |> UI.assert_has(Wallaby.Query.css("[data-test-id=resend-code-status][data-state=success]"))
  end

  step :fill_in_new_activation_code_from_email, ctx do
    emails = Emails.wait_for_email_for(signup_email(ctx), attempts: 10)
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

  defp signup_email(ctx), do: Map.get(ctx, :signup_email, @email)

  defp submit_details(ctx, email) do
    ctx
    |> UI.fill(testid: "email", with: email)
    |> UI.fill(testid: "name", with: "Michael")
    |> UI.fill(testid: "password", with: "123456789ABCder")
    |> UI.fill(testid: "confirmPassword", with: "123456789ABCder")
    |> UI.click(testid: "submit")
  end
end
