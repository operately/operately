defmodule OperatelyWeb.Api.EmailChanges.ResendTest do
  use OperatelyWeb.TurboCase
  import Mock
  alias Operately.People.EmailChange
  alias Operately.Support.Factory

  test "requires authentication", ctx do
    assert {401, _} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: Ecto.UUID.generate()})
    refute Map.has_key?(OperatelyWeb.Api.External.__mutations__(), "email_changes/resend")
  end

  test "rejects API tokens", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_api_token(:api_token, :creator, read_only: false)
    conn = Plug.Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.api_token}")
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")

    assert {401, _} = mutation(conn, [:email_changes, :resend], %{request_id: request.id})
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "rejects missing, null and incorrectly typed request IDs", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")

    for inputs <- [%{}, %{request_id: nil}, %{request_id: 123}, %{request_id: []}, %{request_id: %{}}] do
      assert {400, _} = mutation(ctx.conn, [:email_changes, :resend], inputs)
    end

    assert Repo.reload!(request).invalidated_at == nil
  end

  test "rejects a supplied account identity", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.other, "other-new@example.com")

    assert {400, _} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: request.id, account_id: ctx.other.id})
    assert Repo.reload!(request).invalidated_at == nil
  end

  test "cannot resend another account's request and returns only the signed-in account's state", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    {:ok, other_request} = EmailChange.request(ctx.other, "other-new@example.com")
    {:ok, own_request} = EmailChange.request(ctx.account, "new@example.com")

    assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: other_request.id})
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
      assert {200, %{outcome: "request_invalid", state: state}} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: id})
      assert state.current_email == ctx.account.email
      assert state.pending.id == request.id
    end

    assert Repo.reload!(request).invalidated_at == nil
  end

  test "resends the active stage and returns the cooldown", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    assert {200, %{outcome: "rate_limited"}} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: request.id})
    request |> Ecto.Changeset.change(sent_at: DateTime.utc_now() |> DateTime.add(-61) |> DateTime.truncate(:second)) |> Repo.update!()
    assert {200, %{outcome: "success", state: state}} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: request.id})
    assert state.pending.stage == "current_email"
    assert state.pending.code_recipient == ctx.account.email
    assert state.pending.id != request.id
    assert state.retry_after > 0
  end

  test "new-inbox resend returns safe authorization and delivery failure outcomes", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = Operately.Support.EmailChange.Helpers.request_new_email(ctx.account, "new@example.com")
    Repo.update_all(Operately.People.EmailChangeRequest, set: [sent_at: DateTime.utc_now() |> DateTime.add(-61) |> DateTime.truncate(:second)])

    with_mock OperatelyEmail.Emails.EmailChangeCodeEmail, send: fn _, _ -> {:error, :smtp} end do
      assert {200, %{outcome: "delivery_failed", state: state}} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: request.id})
      assert state.pending.id == request.id
      assert state.pending.stage == "new_email"
    end

    request |> Ecto.Changeset.change(current_email_verified_at: DateTime.utc_now() |> DateTime.add(-601) |> DateTime.truncate(:second)) |> Repo.update!()
    assert {200, %{outcome: "authorization_expired", state: state}} = mutation(ctx.conn, [:email_changes, :resend], %{request_id: request.id})
    assert state.pending.id == request.id
    assert state.current_email == ctx.account.email
  end
end
