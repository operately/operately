defmodule Operately.People.EmailChange.RequestTest do
  use Operately.DataCase
  import Mock

  alias Operately.People.EmailChange.Request
  alias Operately.People.{EmailChange, EmailChangeRequest}
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "request sends a code without changing the account or profiles", ctx do
    assert {:ok, request} = Request.run(ctx.account, "  new@example.com  ")
    assert request.email == "new@example.com"
    code = delivered_code()
    assert byte_size(code) == 6
    assert request.code_hash != code
    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert Repo.reload!(ctx.creator).email == ctx.account.email
    assert EmailChange.state(ctx.account).pending.id == request.id
  end

  test "resend invalidates the previous request and cancellation cannot bypass cooldown", ctx do
    {:ok, first} = Request.run(ctx.account, "new@example.com")
    old_code = delivered_code()
    assert {:error, :rate_limited} = Request.run(ctx.account, "different@example.com")
    assert :ok = EmailChange.cancel(ctx.account, first.id)
    assert {:error, :rate_limited} = Request.run(ctx.account, "different@example.com")
    age_send(first)
    assert {:ok, second} = Request.run(ctx.account, "different@example.com")
    assert second.id != first.id
    assert {:error, :request_invalid} = EmailChange.confirm(ctx.account, first.id, old_code)
  end

  test "hourly limit applies across destinations", ctx do
    for n <- 1..10 do
      assert {:ok, request} = Request.run(ctx.account, "new#{n}@example.com")
      age_send(request)
    end

    assert {:error, :rate_limited} = Request.run(ctx.account, "eleventh@example.com")
  end

  test "rejects invalid, unchanged and registered addresses", ctx do
    ctx = Factory.add_account(ctx, :other)
    assert {:error, :invalid_email} = Request.run(ctx.account, "invalid")
    assert {:error, :email_unchanged} = Request.run(ctx.account, String.upcase(ctx.account.email))
    assert {:error, :email_taken} = Request.run(ctx.account, String.upcase(ctx.other.email))
  end

  test "email changes work when signup is disabled", ctx do
    previous = Application.get_env(:operately, :allow_signup_with_email)
    on_exit(fn -> Application.put_env(:operately, :allow_signup_with_email, previous) end)
    Application.put_env(:operately, :allow_signup_with_email, false)
    assert {:ok, _} = Request.run(ctx.account, "new@example.com")
  end

  test "unconfigured email delivery never creates a usable request", ctx do
    with_mock OperatelyEmail.Mailers.BaseMailer, [:passthrough], email_delivery_configured?: fn -> false end do
      assert {:error, :delivery_unavailable} = Request.run(ctx.account, "new@example.com")
    end

    assert is_nil(EmailChange.state(ctx.account).pending)
  end

  test "a failed resend preserves the prior code and does not consume send quota", ctx do
    {:ok, request} = Request.run(ctx.account, "new@example.com")
    code = delivered_code()
    age_send(request)

    with_mock OperatelyEmail.Emails.CurrentEmailVerificationEmail, send: fn _, _, _ -> {:error, :smtp_unavailable} end do
      assert {:error, :delivery_failed} = Request.run(ctx.account, "different@example.com")
    end

    assert EmailChange.state(ctx.account).pending.id == request.id
    assert Repo.aggregate(EmailChangeRequest, :count) == 1
    assert {:ok, _} = EmailChange.verify_current(ctx.account, request.id, code)
  end

  defp delivered_code do
    assert_receive {:email, %Swoosh.Email{subject: "Operately current email verification code: " <> code}}
    String.replace(code, "-", "")
  end

  defp age_send(request) do
    request |> Ecto.Changeset.change(sent_at: DateTime.add(DateTime.utc_now(), -61) |> DateTime.truncate(:second)) |> Repo.update!()
  end
end
