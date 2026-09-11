defmodule Operately.Features.AccountEmailChangeTest do
  use Operately.FeatureCase
  import Mock
  alias Operately.Support.Features.AccountEmailChangeSteps, as: Steps

  setup_with_mocks [{Operately.ProductReleases, [], [latest: fn -> nil end]}], ctx do
    Steps.setup(ctx)
  end

  feature "change email, resume after refresh, and see the updated account", ctx do
    ctx
    |> Steps.open_email_settings()
    |> Steps.request_code("new@example.com")
    |> Steps.assert_email_unchanged()
    |> Steps.reload_verification()
    |> Steps.confirm_code()
    |> Steps.assert_email_changed()
    |> Steps.assert_account_display_updated()
  end

  feature "correct a destination and cancel verification", ctx do
    ctx
    |> Steps.open_email_settings()
    |> Steps.request_code("typo@example.com")
    |> Steps.change_destination()
    |> Steps.allow_another_send()
    |> Steps.request_code("correct@example.com")
    |> Steps.cancel_change()
    |> Steps.assert_email_unchanged()
  end

  feature "recover from a wrong code and resend an expired code", ctx do
    ctx
    |> Steps.open_email_settings()
    |> Steps.request_code("new@example.com")
    |> Steps.enter_wrong_code()
    |> Steps.expire_code()
    |> Steps.resend_code()
    |> Steps.confirm_code()
    |> Steps.assert_email_changed()
  end

  feature "verification works on a narrow screen", ctx do
    ctx
    |> Steps.use_mobile_viewport()
    |> Steps.open_email_settings()
    |> Steps.request_code("mobile@example.com")
    |> Steps.confirm_code()
    |> Steps.assert_email_changed()
  end
end
