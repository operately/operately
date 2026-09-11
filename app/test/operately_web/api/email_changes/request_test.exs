defmodule OperatelyWeb.Api.EmailChanges.RequestTest do
  use OperatelyWeb.TurboCase
  import Mock
  alias Operately.People.EmailChange
  alias Operately.Support.Factory

  test "requires authentication", ctx do
    assert {401, _} = mutation(ctx.conn, [:email_changes, :request], %{email: "new@example.com"})
  end

  test "does not accept API tokens or expose an external mutation", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_api_token(:api_token, :creator, read_only: false)
    conn = Plug.Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.api_token}")
    assert {401, _} = mutation(conn, [:email_changes, :request], %{email: "new@example.com"})
    refute Map.has_key?(OperatelyWeb.Api.External.__mutations__(), "email_changes/request")
  end

  test "returns typed validation outcomes and preserves the account", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    assert {200, %{outcome: "invalid_email"}} = mutation(ctx.conn, [:email_changes, :request], %{email: "invalid"})
    assert {200, %{outcome: "success", state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: "new@example.com"})
    assert state.current_email == ctx.account.email
    assert state.pending.email == "new@example.com"
    assert {200, %{outcome: "rate_limited"}} = mutation(ctx.conn, [:email_changes, :request], %{email: "other@example.com"})
  end

  test "rejects missing, null and incorrectly typed email inputs", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)

    for inputs <- [%{}, %{email: nil}, %{email: 123}, %{email: []}, %{email: %{}}] do
      assert {400, _} = mutation(ctx.conn, [:email_changes, :request], inputs)
    end

    assert EmailChange.state(ctx.account).pending == nil
    assert Repo.reload!(ctx.account).email == ctx.account.email
    refute_receive {:email, _}
  end

  test "rejects a supplied account identity", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)
    assert {400, _} = mutation(ctx.conn, [:email_changes, :request], %{email: "new@example.com", account_id: ctx.other.id})
    assert EmailChange.state(ctx.account).pending == nil
    assert EmailChange.state(ctx.other).pending == nil
  end

  test "returns unchanged and duplicate email outcomes without creating a request", ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_account(:other) |> Factory.log_in_account(:account)

    for {email, outcome} <- [{String.upcase(ctx.account.email), "email_unchanged"}, {String.upcase(ctx.other.email), "email_taken"}] do
      assert {200, %{outcome: ^outcome, state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: email})
      assert state.current_email == ctx.account.email
      assert state.pending == nil
      assert state.retry_after == 0
    end

    assert Repo.reload!(ctx.account).email == ctx.account.email
    refute_receive {:email, _}
  end

  test "returns the trimmed destination and sends its verification code", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    assert {200, %{outcome: "success", state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: "  new@example.com  "})
    assert state.current_email == ctx.account.email
    assert state.pending.email == "new@example.com"
    assert state.pending.attempts_remaining == 5
    assert state.retry_after > 0
    assert state.retry_after <= 60
    assert {:ok, _, _} = DateTime.from_iso8601(state.pending.expires_at)
    assert_receive {:email, %Swoosh.Email{to: [{_, "new@example.com"}], subject: "Operately email change code: " <> _code}}
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "a rate-limited request returns the existing destination and remaining wait", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")

    assert {200, %{outcome: "rate_limited", state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: "different@example.com"})
    assert state.current_email == ctx.account.email
    assert state.pending.id == request.id
    assert state.pending.email == request.email
    assert state.retry_after > 0
    assert state.retry_after <= 60
  end

  test "resending returns a new request and invalidates the previous one", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    age_send(request)

    assert {200, %{outcome: "success", state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: request.email})
    assert state.current_email == ctx.account.email
    assert state.pending.id != request.id
    assert state.pending.email == request.email
    assert state.pending.attempts_remaining == 5
    assert Repo.reload!(request).invalidated_at != nil
  end

  test "returns delivery_unavailable without creating a pending request", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)

    with_mock OperatelyEmail.Mailers.BaseMailer, [:passthrough], email_delivery_configured?: fn -> false end do
      assert {200, %{outcome: "delivery_unavailable", state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: "new@example.com"})
      assert state.current_email == ctx.account.email
      assert state.pending == nil
      assert state.retry_after == 0
    end

    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "returns delivery_failed without presenting an unsent code as usable", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)

    with_mock OperatelyEmail.Emails.EmailChangeCodeEmail, send: fn _, _ -> {:error, :smtp_unavailable} end do
      assert {200, %{outcome: "delivery_failed", state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: "new@example.com"})
      assert state.current_email == ctx.account.email
      assert state.pending == nil
      assert state.retry_after == 0
    end

    assert EmailChange.state(ctx.account).pending == nil
    assert Repo.reload!(ctx.account).email == ctx.account.email
  end

  test "a failed resend returns the prior request and allows retrying", ctx do
    ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
    {:ok, request} = EmailChange.request(ctx.account, "new@example.com")
    age_send(request)

    with_mock OperatelyEmail.Emails.EmailChangeCodeEmail, send: fn _, _ -> {:error, :smtp_unavailable} end do
      assert {200, %{outcome: "delivery_failed", state: state}} = mutation(ctx.conn, [:email_changes, :request], %{email: "different@example.com"})
      assert state.current_email == ctx.account.email
      assert state.pending.id == request.id
      assert state.pending.email == request.email
      assert state.retry_after == 0
    end

    assert Repo.reload!(request).invalidated_at == nil
    assert {200, %{outcome: "success"}} = mutation(ctx.conn, [:email_changes, :request], %{email: "different@example.com"})
  end

  defp age_send(request) do
    request |> Ecto.Changeset.change(sent_at: DateTime.utc_now() |> DateTime.add(-61) |> DateTime.truncate(:second)) |> Repo.update!()
  end
end
