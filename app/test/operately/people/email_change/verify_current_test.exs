defmodule Operately.People.EmailChange.VerifyCurrentTest do
  use Operately.DataCase
  import Mock

  alias Operately.People.{Account, EmailChange, EmailChangeRequest}
  alias Operately.Support.Factory

  setup ctx, do: Factory.setup(ctx)

  test "verifies the current inbox before sending to the destination, without the resend cooldown", ctx do
    {:ok, first} = EmailChange.request(ctx.account, "new@example.com")
    assert_receive {:email, email}
    assert email.to == [{"", ctx.account.email}]
    assert email.text_body =~ "new@example.com"
    [_, code] = Regex.run(~r/([A-Z0-9]{3}-[A-Z0-9]{3})$/, email.subject)
    assert {:ok, second} = EmailChange.verify_current(ctx.account, first.id, String.downcase(code))
    assert second.stage == :new_email
    assert second.current_email_verified_at
    assert second.id != first.id
    assert Repo.reload!(first).invalidated_at
    assert_receive {:email, %Swoosh.Email{to: [{"", "new@example.com"}]}}
    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert {:error, :request_invalid} = EmailChange.verify_current(ctx.account, first.id, code)
    assert {:error, :request_invalid} = EmailChange.verify_current(ctx.account, second.id, code)
  end

  test "failed attempts commit and exhausted codes cannot advance", ctx do
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = current_code()
    for _ <- 1..4, do: assert({:error, :invalid_code} = EmailChange.verify_current(ctx.account, request.id, "!!!!!!"))
    assert {:error, :too_many_attempts} = EmailChange.verify_current(ctx.account, request.id, "!!!!!!")
    assert {:error, :too_many_attempts} = EmailChange.verify_current(ctx.account, request.id, code)
    assert Repo.reload!(request).attempts == 5
    refute_receive {:email, _}
  end

  test "expired, foreign and stale-original requests cannot advance", ctx do
    ctx = Factory.add_account(ctx, :other)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = current_code()
    assert {:error, :request_invalid} = EmailChange.verify_current(ctx.other, request.id, code)
    request |> Ecto.Changeset.change(expires_at: past()) |> Repo.update!()
    assert {:error, :code_expired} = EmailChange.verify_current(ctx.account, request.id, code)
    ctx.account |> Account.email_changeset(%{email: "changed@example.com"}) |> Repo.update!()
    assert {:error, :request_invalid} = EmailChange.verify_current(ctx.account, request.id, code)
    refute_receive {:email, _}
  end

  test "a duplicate destination and failed delivery preserve current-inbox verification", ctx do
    ctx = Factory.add_account(ctx, :other)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = current_code()

    with_mock OperatelyEmail.Emails.EmailChangeCodeEmail, send: fn _, _ -> {:error, :smtp} end do
      assert {:error, :delivery_failed} = EmailChange.verify_current(ctx.account, request.id, code)
    end

    assert Repo.reload!(request).invalidated_at == nil
    assert Repo.aggregate(EmailChangeRequest, :count) == 1
    ctx.other |> Account.email_changeset(%{email: request.email}) |> Repo.update!()
    assert {:error, :email_taken} = EmailChange.verify_current(ctx.account, request.id, code)
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "the hourly quota includes both stages and applies to advancing", ctx do
    for n <- 1..9 do
      {:ok, request} = EmailChange.request(ctx.account, "new#{n}@example.com")
      current_code()
      request |> Ecto.Changeset.change(sent_at: DateTime.add(past(), -60)) |> Repo.update!()
    end

    {:ok, request} = EmailChange.request(ctx.account, "last@example.com")
    assert {:error, :rate_limited} = EmailChange.verify_current(ctx.account, request.id, current_code())
    assert Repo.reload!(request).invalidated_at == nil
    assert Repo.aggregate(EmailChangeRequest, :count) == 10
  end

  test "concurrent verification issues only one new-inbox request", ctx do
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = current_code()
    results = 1..2 |> Task.async_stream(fn _ -> EmailChange.verify_current(ctx.account, request.id, code) end) |> Enum.map(fn {:ok, result} -> result end)
    assert Enum.count(results, &match?({:ok, _}, &1)) == 1
    assert Enum.count(results, &(&1 == {:error, :request_invalid})) == 1
    assert Repo.aggregate(EmailChangeRequest, :count) == 2
  end

  test "signup codes cannot verify the current inbox and its code cannot verify the new inbox", ctx do
    {:ok, activation} = Operately.People.EmailActivationCode.create(ctx.account.email)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = current_code()
    assert {:error, :invalid_code} = EmailChange.verify_current(ctx.account, request.id, activation.code)
    {:ok, new_request} = EmailChange.verify_current(ctx.account, request.id, code)
    assert {:error, :invalid_code} = EmailChange.confirm(ctx.account, new_request.id, code)
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  defp current_code do
    assert_receive {:email, %Swoosh.Email{subject: "Operately current email verification code: " <> code}}
    code
  end

  defp past, do: DateTime.utc_now() |> DateTime.add(-1) |> DateTime.truncate(:second)
end
