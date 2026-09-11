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
end
