defmodule OperatelyWeb.Api.EmailChanges.VerifyCurrentTest do
  use OperatelyWeb.TurboCase
  alias Operately.People.EmailChange
  alias Operately.Support.Factory

  test "requires authentication", ctx do
    assert {401, _} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: Ecto.UUID.generate(), code: "ABC123"})
    refute Map.has_key?(OperatelyWeb.Api.External.__mutations__(), "email_changes/verify_current")
  end

  test "advances to the new inbox without changing the account email", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert_receive {:email, %Swoosh.Email{subject: "Operately current email verification code: " <> code}}
    assert {200, %{outcome: "invalid_code"}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: "wrong"})
    assert {200, %{outcome: "success", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: code})
    assert state.current_email == ctx.account.email
    assert state.pending.stage == "new_email"
    assert state.pending.code_recipient == "new@example.com"
    assert state.pending.authorization_expires_at
    assert state.pending.id != request.id
  end

  test "a malformed request ID is a recoverable error", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    assert {200, %{outcome: "request_invalid"}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: "invalid", code: "ABC123"})
  end

  test "rejects API tokens", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_api_token(:api_token, :creator, read_only: false)
    conn = Plug.Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.api_token}")
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()

    assert {401, _} = mutation(conn, [:email_changes, :verify_current], %{request_id: request.id, code: code})
    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "rejects missing, null and incorrectly typed inputs without consuming an attempt", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    valid = %{request_id: request.id, code: delivered_code()}

    for field <- [:request_id, :code], invalid <- [:missing, nil, 123, [], %{}] do
      inputs = if invalid == :missing, do: Map.delete(valid, field), else: Map.put(valid, field, invalid)
      assert {400, _} = mutation(ctx.conn, [:email_changes, :verify_current], inputs)
    end

    assert Repo.reload!(request).attempts == 0
    assert Repo.reload!(request).invalidated_at == nil
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "rejects a supplied account identity", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.other, "other-new@example.com")
    inputs = %{request_id: request.id, code: delivered_code(), account_id: ctx.other.id}

    assert {400, _} = mutation(ctx.conn, [:email_changes, :verify_current], inputs)
    assert Repo.reload!(ctx.other).email == ctx.other.email
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "cannot confirm another account's request even with the correct code", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, other_request} = EmailChange.request(ctx.other, "other-new@example.com")
    other_code = delivered_code()
    {:ok, own_request} = EmailChange.request(ctx.account, "new@example.com")

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: other_request.id, code: other_code})
    assert state.current_email == ctx.account.email
    assert state.pending.id == own_request.id
    assert state.pending.email == own_request.email
    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert Repo.reload!(ctx.other).email == ctx.other.email
    assert Repo.reload!(other_request).attempts == 0
    assert Repo.reload!(other_request).invalidated_at == nil
  end

  test "returns remaining attempts and leaves the email unchanged for an invalid code", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")

    assert {200, %{outcome: "invalid_code", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: "!!!!!!"})
    assert state.current_email == ctx.account.email
    assert state.pending.id == request.id
    assert state.pending.attempts_remaining == 4
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "returns code_expired with the pending state", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()
    expired_at = DateTime.utc_now() |> DateTime.add(-1) |> DateTime.truncate(:second)
    request |> Ecto.Changeset.change(expires_at: expired_at) |> Repo.update!()

    assert {200, %{outcome: "code_expired", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: code})
    assert state.current_email == ctx.account.email
    assert state.pending.id == request.id
    assert state.pending.expires_at == DateTime.to_iso8601(expired_at)
    assert state.pending.attempts_remaining == 5
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "returns too_many_attempts and refuses the correct code once exhausted", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()
    request |> Ecto.Changeset.change(attempts: 4) |> Repo.update!()

    for code <- ["!!!!!!", code] do
      assert {200, %{outcome: "too_many_attempts", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: code})
      assert state.current_email == ctx.account.email
      assert state.pending.id == request.id
      assert state.pending.attempts_remaining == 0
    end

    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert Repo.reload!(request).attempts == 5
  end

  test "returns email_taken when the destination is registered before confirmation", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()
    ctx.other |> Operately.People.Account.email_changeset(%{email: request.email}) |> Repo.update!()

    assert {200, %{outcome: "email_taken", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: code})
    assert state.current_email == ctx.account.email
    assert state.pending.id == request.id
    assert Repo.reload!(ctx.account).email == ctx.account.email
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "cannot confirm a cancelled request", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()
    :ok = EmailChange.cancel(ctx.account, request.id)

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: code})
    assert state.current_email == ctx.account.email
    assert state.pending == nil
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "cannot confirm a replaced request and returns the replacement state", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    code = delivered_code()
    Repo.update_all(Operately.People.EmailChangeRequest, set: [sent_at: DateTime.utc_now() |> DateTime.add(-61) |> DateTime.truncate(:second)])
    {:ok, replacement} = EmailChange.request(ctx.account, "different@example.com")

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], %{request_id: request.id, code: code})
    assert state.current_email == ctx.account.email
    assert state.pending.id == replacement.id
    assert state.pending.email == replacement.email
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "cannot replay a consumed current-inbox request", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    inputs = %{request_id: request.id, code: delivered_code()}
    assert {200, %{outcome: "success"}} = mutation(ctx.conn, [:email_changes, :verify_current], inputs)

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :verify_current], inputs)
    assert state.current_email == ctx.account.email
    assert state.pending.stage == "new_email"
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  defp delivered_code do
    assert_receive {:email, %Swoosh.Email{subject: "Operately current email verification code: " <> code}}
    code
  end
end
