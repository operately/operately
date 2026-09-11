defmodule Operately.People.EmailChange.ConfirmTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.People.EmailChange.Confirm
  alias Operately.People.{Account, EmailChange, EmailChangeRequest}
  import Operately.Support.EmailChange.Helpers
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "a session and the first email code cannot change the account email", ctx do
    {:ok, request} = EmailChange.request(ctx.account, "attacker@example.com")
    assert_receive {:email, email}
    [_, code] = Regex.run(~r/([A-Z0-9]{3}-[A-Z0-9]{3})$/, email.subject)

    assert {:error, :request_invalid} = Confirm.run(ctx.account, request.id, code)
    assert email.to == [{"", ctx.account.email}]
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "five incorrect attempts permanently exhaust the request", ctx do
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    code = delivered_code()
    for _ <- 1..4, do: assert({:error, :invalid_code} = Confirm.run(ctx.account, request.id, "!!!!!!"))
    assert {:error, :too_many_attempts} = Confirm.run(ctx.account, request.id, "!!!!!!")
    assert {:error, :too_many_attempts} = Confirm.run(ctx.account, request.id, code)
    assert Repo.reload!(request).attempts == 5
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "rechecks uniqueness at confirmation without consuming the request", ctx do
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    code = delivered_code()
    ctx = Factory.add_account(ctx, :other)
    ctx.other |> Account.email_changeset(%{email: "new@example.com"}) |> Repo.update!()
    assert {:error, :email_taken} = Confirm.run(ctx.account, request.id, code)
    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert is_nil(Repo.reload!(request).invalidated_at)
  end

  test "signup codes cannot confirm email changes", ctx do
    {:ok, activation} = Operately.People.EmailActivationCode.create("new@example.com")
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    assert {:error, :invalid_code} = Confirm.run(ctx.account, request.id, activation.code)
    refute Repo.get!(EmailChangeRequest, request.id).invalidated_at
  end

  test "a request becomes invalid if the original email changes", ctx do
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    code = delivered_code()
    ctx.account |> Account.email_changeset(%{email: "changed-elsewhere@example.com"}) |> Repo.update!()
    assert {:error, :request_invalid} = Confirm.run(ctx.account, request.id, code)
    assert is_nil(EmailChange.state(ctx.account).pending)
  end

  test "concurrent confirmations consume a request only once", ctx do
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    code = delivered_code()

    results =
      1..2
      |> Task.async_stream(
        fn _ ->
          Oban.Testing.with_testing_mode(:manual, fn -> Confirm.run(ctx.account, request.id, code) end)
        end,
        max_concurrency: 2
      )
      |> Enum.map(fn {:ok, result} -> result end)

    assert Enum.count(results, &(&1 == :ok)) == 1
    assert Enum.count(results, &(&1 == {:error, :request_invalid})) == 1
    assert length(all_enqueued(worker: Operately.People.EmailChangedEmailWorker)) == 1
  end

  test "legacy and unverified new-inbox requests cannot authorize a change", ctx do
    {:ok, request} = request_new_email(ctx.account, "new@example.com")
    code = delivered_code()
    request |> Ecto.Changeset.change(current_email_verified_at: nil) |> Repo.update!()
    assert {:error, :request_invalid} = Confirm.run(ctx.account, request.id, code)
    request |> Ecto.Changeset.change(stage: nil) |> Repo.update!()
    assert {:error, :request_invalid} = Confirm.run(ctx.account, request.id, code)
    assert EmailChange.state(ctx.account).pending == nil
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "two accounts cannot confirm the same destination", ctx do
    ctx = Factory.add_account(ctx, :other)
    {:ok, first} = request_new_email(ctx.account, "shared@example.com")
    first_code = delivered_code()
    {:ok, second} = request_new_email(ctx.other, "shared@example.com")
    second_code = delivered_code()

    results =
      [{ctx.account, first, first_code}, {ctx.other, second, second_code}]
      |> Task.async_stream(fn {account, request, code} ->
        Oban.Testing.with_testing_mode(:manual, fn -> Confirm.run(account, request.id, code) end)
      end)
      |> Enum.map(fn {:ok, result} -> result end)

    assert Enum.count(results, &(&1 == :ok)) == 1
    assert Enum.count(results, &(&1 == {:error, :email_taken})) == 1
    assert Repo.aggregate(from(a in Account, where: a.email == "shared@example.com"), :count) == 1
  end

  defp delivered_code do
    assert_receive {:email, %Swoosh.Email{subject: "Operately email change code: " <> code}}
    String.replace(code, "-", "")
  end
end
