defmodule OperatelyEE.AccountOnboardingJobTest do
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

    with_mock Req, put: fn _url, headers: _headers, json: _body -> mock_response end do
      assert :ok = OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
    end
  end

  test "discards the job when SendGrid forbids the request", ctx do
    mock_response = {:ok, %{status: 403, body: %{"errors" => [%{"message" => "access forbidden"}]}}}

    with_mock Req, put: fn _url, headers: _headers, json: _body -> mock_response end do
      assert {:discard, reason} = OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
      assert reason =~ "403"
      assert reason =~ "access forbidden"
    end
  end

  test "discards the job when SendGrid rejects the request as a client error", ctx do
    mock_response = {:ok, %{status: 400, body: %{"errors" => [%{"message" => "invalid email"}]}}}

    with_mock Req, put: fn _url, headers: _headers, json: _body -> mock_response end do
      assert {:discard, reason} = OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
      assert reason =~ "400"
    end
  end

  test "retries when SendGrid rate-limits the request", ctx do
    mock_response = {:ok, %{status: 429, body: %{"errors" => [%{"message" => "too many requests"}]}}}

    with_mock Req, put: fn _url, headers: _headers, json: _body -> mock_response end do
      assert {:error, reason} = OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
      assert reason =~ "429"
    end
  end

  test "retries when SendGrid is unavailable", ctx do
    mock_response = {:ok, %{status: 503, body: "unavailable"}}

    with_mock Req, put: fn _url, headers: _headers, json: _body -> mock_response end do
      assert {:error, reason} = OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
      assert reason =~ "503"
    end
  end

  test "retries when the SendGrid request fails to connect", ctx do
    with_mock Req, put: fn _url, headers: _headers, json: _body -> {:error, %{reason: :timeout}} end do
      assert {:error, "Failed to add contact to SendGrid list"} =
               OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
    end
  end

  test "discards the job when the account no longer exists" do
    assert {:discard, "account_not_found"} =
             OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => Ecto.UUID.generate()}})
  end

  test "does not call SendGrid when onboarding emails are disabled", ctx do
    Application.put_env(:operately, :send_onboarding_emails, false)

    with_mock Req, put: fn _url, headers: _headers, json: _body -> flunk("SendGrid should not be called") end do
      assert :ok = OperatelyEE.AccountOnboardingJob.perform(%{args: %{"account_id" => ctx.account.id}})
    end
  end
end
