defmodule OperatelyEE.AccountOnboardingTest do
  use Operately.DataCase
  import Mock

  setup ctx do
    ctx = Factory.setup(ctx) |> Factory.add_account(:account)

    current = Application.get_env(:operately, :send_onboarding_emails)
    Application.put_env(:operately, :send_onboarding_emails, true)

    on_exit(fn -> 
      Application.put_env(:operately, :send_onboarding_emails, current)
    end)

    {:ok, ctx}
  end

  test "it adds the new user to the contact list", ctx do
    mock_response = {:ok, %{status: 202, body: "Mocked response"}}

    with_mock Req, [put!: fn(_url, headers: _headers, json: _body) -> mock_response end] do
      assert :ok = OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
    end
  end
end
