defmodule Operately.People.EmailChange.ResendTest do
  use Operately.DataCase
  import Mock
  alias Operately.People.{EmailChange, EmailChangeRequest}
  alias Operately.Support.Factory

  setup ctx, do: Factory.setup(ctx)

  test "resends to the current inbox and invalidates its preceding code", ctx do
    {:ok, first} = EmailChange.request(ctx.account, "new@example.com")
    assert {:error, :rate_limited} = EmailChange.resend(ctx.account, first.id)
    age_sends(ctx.account)
    {:ok, second} = EmailChange.resend(ctx.account, first.id)
    assert second.stage == :current_email
    assert second.current_email_verified_at == nil
    assert Repo.reload!(first).invalidated_at
    assert_receive {:email, %Swoosh.Email{to: [{"", email}]}}
    assert email == ctx.account.email
    assert {:error, :request_invalid} = EmailChange.resend(ctx.account, first.id)
  end

  test "new-inbox resends preserve the authorization deadline and cap code expiry", ctx do
    request = new_inbox_request(ctx.account)
    verified_at = DateTime.utc_now() |> DateTime.add(-480) |> DateTime.truncate(:second)
    request |> Ecto.Changeset.change(current_email_verified_at: verified_at) |> Repo.update!()
    age_sends(ctx.account)
    {:ok, resent} = EmailChange.resend(ctx.account, request.id)
    assert resent.current_email_verified_at == verified_at
    assert resent.expires_at == DateTime.add(verified_at, 600)
    assert resent.stage == :new_email
  end

  test "expired authorization requires starting again, including at confirmation", ctx do
    request = new_inbox_request(ctx.account)
    assert_receive {:email, %Swoosh.Email{subject: "Operately email change code: " <> code}}
    request |> Ecto.Changeset.change(current_email_verified_at: DateTime.utc_now() |> DateTime.add(-601) |> DateTime.truncate(:second)) |> Repo.update!()
    age_sends(ctx.account)
    assert {:error, :authorization_expired} = EmailChange.resend(ctx.account, request.id)
    assert {:error, :authorization_expired} = EmailChange.confirm(ctx.account, request.id, code)
    {:ok, restarted} = EmailChange.request(ctx.account, request.email)
    assert restarted.stage == :current_email
    assert restarted.current_email_verified_at == nil
  end

  test "a different destination always restarts current-inbox verification", ctx do
    request = new_inbox_request(ctx.account)
    age_sends(ctx.account)
    {:ok, replacement} = EmailChange.request(ctx.account, "different@example.com")
    assert replacement.stage == :current_email
    assert replacement.current_email_verified_at == nil
    assert Repo.reload!(request).invalidated_at
  end

  test "failed new-inbox delivery preserves the prior code and quota", ctx do
    request = new_inbox_request(ctx.account)
    age_sends(ctx.account)

    with_mock OperatelyEmail.Emails.EmailChangeCodeEmail, send: fn _, _ -> {:error, :smtp} end do
      assert {:error, :delivery_failed} = EmailChange.resend(ctx.account, request.id)
    end

    assert Repo.reload!(request).invalidated_at == nil
    assert Repo.aggregate(EmailChangeRequest, :count) == 2
  end

  test "rejects foreign and cancelled requests", ctx do
    ctx = Factory.add_account(ctx, :other)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert {:error, :request_invalid} = EmailChange.resend(ctx.other, request.id)
    :ok = EmailChange.cancel(ctx.account, request.id)
    assert {:error, :request_invalid} = EmailChange.resend(ctx.account, request.id)
  end

  defp new_inbox_request(account) do
    {:ok, request} = EmailChange.request(account, "new@example.com")
    assert_receive {:email, %Swoosh.Email{subject: "Operately current email verification code: " <> code}}
    {:ok, request} = EmailChange.verify_current(account, request.id, code)
    request
  end

  defp age_sends(account) do
    Repo.update_all(from(r in EmailChangeRequest, where: r.account_id == ^account.id), set: [sent_at: DateTime.utc_now() |> DateTime.add(-61) |> DateTime.truncate(:second)])
  end
end
