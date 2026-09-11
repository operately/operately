defmodule OperatelyWeb.Api.EmailChanges.CancelTest do
  use OperatelyWeb.TurboCase
  alias Operately.People.EmailChange
  alias Operately.Support.Factory

  test "requires authentication", ctx do
    assert {401, _} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: Ecto.UUID.generate()})
    refute Map.has_key?(OperatelyWeb.Api.External.__mutations__(), "email_changes/cancel")
  end

  test "cancels verification without changing the email or resetting cooldown", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert {200, %{outcome: "success", state: state}} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: request.id})
    assert state.pending == nil
    assert state.current_email == ctx.account.email
    assert state.retry_after > 0
  end

  test "rejects API tokens", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_api_token(:api_token, :creator, read_only: false)
    conn = Plug.Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.api_token}")
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")

    assert {401, _} = mutation(conn, [:email_changes, :cancel], %{request_id: request.id})
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "rejects missing, null and incorrectly typed request IDs", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")

    for inputs <- [%{}, %{request_id: nil}, %{request_id: 123}, %{request_id: []}, %{request_id: %{}}] do
      assert {400, _} = mutation(ctx.conn, [:email_changes, :cancel], inputs)
    end

    assert Repo.reload!(request).invalidated_at == nil
  end

  test "rejects a supplied account identity", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.other, "other-new@example.com")

    assert {400, _} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: request.id, account_id: ctx.other.id})
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "cannot cancel another account's request and returns only the signed-in account's state", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, other_request} = EmailChange.request(ctx.other, "other-new@example.com")
    {:ok, own_request} = EmailChange.request(ctx.account, "new@example.com")

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: other_request.id})
    assert state.current_email == ctx.account.email
    assert state.pending.id == own_request.id
    assert state.pending.email == own_request.email
    assert Repo.reload!(other_request).invalidated_at == nil
    assert Repo.reload!(own_request).invalidated_at == nil
  end

  test "malformed and unknown request IDs return a recoverable error", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")

    for id <- ["invalid", Ecto.UUID.generate()] do
      assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: id})
      assert state.current_email == ctx.account.email
      assert state.pending.id == request.id
    end

    assert Repo.reload!(request).invalidated_at == nil
  end

  test "cancelling twice returns request_invalid and preserves the resend cooldown", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert {200, %{outcome: "success"}} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: request.id})

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: request.id})
    assert state.current_email == ctx.account.email
    assert state.pending == nil
    assert state.retry_after > 0
  end

  test "cancelling a replaced request leaves the replacement active", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    request |> Ecto.Changeset.change(sent_at: DateTime.utc_now() |> DateTime.add(-61) |> DateTime.truncate(:second)) |> Repo.update!()
    {:ok, replacement} = EmailChange.request(ctx.account, "different@example.com")

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: request.id})
    assert state.current_email == ctx.account.email
    assert state.pending.id == replacement.id
    assert Repo.reload!(replacement).invalidated_at == nil
  end

  test "cannot cancel a consumed request or revert the new email", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert_receive {:email, %Swoosh.Email{subject: "Operately email change code: " <> code}}
    :ok = EmailChange.confirm(ctx.account, request.id, code)

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :cancel], %{request_id: request.id})
    assert state.current_email == request.email
    assert state.pending == nil
    assert Repo.reload!(ctx.account).email == request.email
  end
end
