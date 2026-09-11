defmodule OperatelyWeb.Api.EmailChanges.GetTest do
  use OperatelyWeb.TurboCase
  alias Operately.People.EmailChange
  alias Operately.Support.Factory

  test "requires a browser session", ctx do
    assert {401, _} = query(ctx.conn, [:email_changes, :get], %{})
    refute Map.has_key?(OperatelyWeb.Api.External.__queries__(), "email_changes/get")
  end

  test "returns authoritative email and safe pending state", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert {200, %{state: state}} = query(ctx.conn, [:email_changes, :get], %{})
    assert state.current_email == ctx.account.email
    assert state.pending.id == request.id
    assert state.pending.email == "new@example.com"
    assert state.retry_after > 0
    refute Map.has_key?(state.pending, :code_hash)
    refute Map.has_key?(state.pending, :original_email)
  end

  test "rejects API tokens", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_api_token(:api_token, :creator, read_only: false)
    conn = Plug.Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.api_token}")
    assert {401, _} = query(conn, [:email_changes, :get], %{})
  end

  test "returns empty state when the account has no pending request", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    assert {200, %{state: state}} = query(ctx.conn, [:email_changes, :get], %{})
    assert state.current_email == ctx.account.email
    assert state.pending == nil
    assert state.retry_after == 0
  end

  test "returns only the signed-in account's pending request", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, other_request} = EmailChange.request(ctx.other, "other-new@example.com")

    assert {200, %{state: state}} = query(ctx.conn, [:email_changes, :get], %{})
    assert state.current_email == ctx.account.email
    assert state.pending == nil
    assert state.retry_after == 0

    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert {200, %{state: state}} = query(ctx.conn, [:email_changes, :get], %{})
    assert state.pending.id == request.id
    assert state.pending.email == request.email
    assert state.pending.id != other_request.id
  end

  test "rejects a supplied account identity", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    assert {400, _} = query(ctx.conn, [:email_changes, :get], %{account_id: ctx.other.id})
  end

  test "keeps expired requests visible so verification can resume with a resend", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    expired_at = DateTime.utc_now() |> DateTime.add(-1) |> DateTime.truncate(:second)
    request |> Ecto.Changeset.change(expires_at: expired_at) |> Repo.update!()

    assert {200, %{state: state}} = query(ctx.conn, [:email_changes, :get], %{})
    assert state.current_email == ctx.account.email
    assert state.pending.id == request.id
    assert state.pending.expires_at == DateTime.to_iso8601(expired_at)
    assert state.pending.attempts_remaining == 5
  end

  test "legacy requests cannot resume or bypass current-inbox verification", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    request |> Ecto.Changeset.change(stage: nil) |> Repo.update!()
    assert {200, %{state: %{pending: nil}}} = query(ctx.conn, [:email_changes, :get], %{})
    assert {200, %{outcome: "request_invalid"}} = mutation(ctx.conn, [:email_changes, :confirm], %{request_id: request.id, code: "ABC123"})
  end

  test "resumes the new-inbox stage with its recipient and authorization deadline", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = Operately.Support.EmailChange.Helpers.request_new_email(ctx.account, "new@example.com")
    assert {200, %{state: state}} = query(ctx.conn, [:email_changes, :get], %{})
    assert state.current_email == ctx.account.email
    assert state.pending.id == request.id
    assert state.pending.stage == "new_email"
    assert state.pending.code_recipient == request.email
    assert state.pending.authorization_expires_at == DateTime.to_iso8601(DateTime.add(request.current_email_verified_at, 600))
  end
end
