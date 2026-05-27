defmodule OperatelyWeb.PolarWebhookControllerTest do
  use OperatelyWeb.ConnCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Billing.WebhookEvent
  alias Operately.Billing.Polar.ProcessWebhookWorker
  alias Operately.Repo

  @secret "polar_whs_" <> Base.encode64("polar_test_webhook_secret")

  setup do
    previous_secret = Application.get_env(:operately, :polar_webhook_secret)
    previous_tolerance = Application.get_env(:operately, :polar_webhook_timestamp_tolerance_seconds)
    Application.put_env(:operately, :polar_webhook_secret, @secret)
    Application.put_env(:operately, :polar_webhook_timestamp_tolerance_seconds, 5 * 60)

    on_exit(fn ->
      if previous_secret do
        Application.put_env(:operately, :polar_webhook_secret, previous_secret)
      else
        Application.delete_env(:operately, :polar_webhook_secret)
      end

      if previous_tolerance do
        Application.put_env(:operately, :polar_webhook_timestamp_tolerance_seconds, previous_tolerance)
      else
        Application.delete_env(:operately, :polar_webhook_timestamp_tolerance_seconds)
      end
    end)

    :ok
  end

  describe "POST /webhooks/polar" do
    test "returns 202 for a valid signed request", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})
      expected_payload = Jason.decode!(payload)

      Oban.Testing.with_testing_mode(:manual, fn ->
        conn =
          conn
          |> signed_webhook_request(payload)
          |> post("/webhooks/polar", payload)

        assert response(conn, 202) == ""

        event = Repo.get_by!(WebhookEvent, provider: "polar", event_id: "msg_123")
        assert event.event_type == "customer.state_changed"
        assert event.payload == expected_payload
        assert event.status == :pending
        assert event.received_at

        assert_enqueued(worker: ProcessWebhookWorker, args: %{billing_webhook_event_id: event.id})
      end)
    end

    test "accepts a valid signed request when the webhook secret is user-defined", %{conn: conn} do
      custom_secret = "user_defined_webhook_secret"
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})

      previous_secret = Application.get_env(:operately, :polar_webhook_secret)
      Application.put_env(:operately, :polar_webhook_secret, custom_secret)

      on_exit(fn ->
        if previous_secret do
          Application.put_env(:operately, :polar_webhook_secret, previous_secret)
        else
          Application.delete_env(:operately, :polar_webhook_secret)
        end
      end)

      Oban.Testing.with_testing_mode(:manual, fn ->
        conn =
          conn
          |> signed_webhook_request(payload, webhook_id: "msg_custom_secret", secret: custom_secret)
          |> post("/webhooks/polar", payload)

        assert response(conn, 202) == ""
      end)
    end

    test "verifies the exact raw request body", %{conn: conn} do
      payload = """
      {
        "type": "customer.state_changed",
        "data": { "z": 1, "a": [1, 2, 3] }
      }
      """

      Oban.Testing.with_testing_mode(:manual, fn ->
        conn =
          conn
          |> signed_webhook_request(payload)
          |> post("/webhooks/polar", payload)

        assert response(conn, 202) == ""
      end)
    end

    test "deduplicates webhook deliveries by webhook-id", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})

      Oban.Testing.with_testing_mode(:manual, fn ->
        conn =
          conn
          |> signed_webhook_request(payload, webhook_id: "msg_duplicate")
          |> post("/webhooks/polar", payload)

        assert response(conn, 202) == ""

        conn =
          build_conn()
          |> signed_webhook_request(payload, webhook_id: "msg_duplicate")
          |> post("/webhooks/polar", payload)

        assert response(conn, 202) == ""

        assert Repo.aggregate(WebhookEvent, :count, :id) == 1

        jobs = all_enqueued(worker: ProcessWebhookWorker)
        assert length(jobs) == 1
      end)
    end

    test "returns 403 for an invalid signature", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> put_req_header("webhook-id", "msg_invalid")
        |> put_req_header("webhook-timestamp", "#{System.system_time(:second)}")
        |> put_req_header("webhook-signature", "v1,#{Base.encode64("not_a_valid_signature")}")
        |> post("/webhooks/polar", payload)

      assert response(conn, 403) == ""
      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end

    test "returns 403 when webhook-id is missing", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})
      timestamp = "#{System.system_time(:second)}"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> put_req_header("webhook-timestamp", timestamp)
        |> put_req_header("webhook-signature", signature_header("msg_missing", timestamp, payload))
        |> post("/webhooks/polar", payload)

      assert response(conn, 403) == ""
      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end

    test "returns 403 when webhook-timestamp is missing", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> put_req_header("webhook-id", "msg_missing")
        |> put_req_header("webhook-signature", signature_header("msg_missing", "#{System.system_time(:second)}", payload))
        |> post("/webhooks/polar", payload)

      assert response(conn, 403) == ""
      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end

    test "returns 403 when webhook-signature is missing", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> put_req_header("webhook-id", "msg_missing")
        |> put_req_header("webhook-timestamp", "#{System.system_time(:second)}")
        |> post("/webhooks/polar", payload)

      assert response(conn, 403) == ""
      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end

    test "returns 403 for a stale timestamp", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})
      timestamp = "#{System.system_time(:second) - 301}"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> put_req_header("webhook-id", "msg_stale")
        |> put_req_header("webhook-timestamp", timestamp)
        |> put_req_header("webhook-signature", signature_header("msg_stale", timestamp, payload))
        |> post("/webhooks/polar", payload)

      assert response(conn, 403) == ""
      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end

    test "accepts multiple signatures when one valid v1 signature matches", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})
      webhook_id = "msg_rotated"
      timestamp = "#{System.system_time(:second)}"
      valid_signature = signature_header(webhook_id, timestamp, payload)
      invalid_signature = "v1,#{Base.encode64("old_signature_that_does_not_match")}"

      Oban.Testing.with_testing_mode(:manual, fn ->
        conn =
          conn
          |> put_req_header("content-type", "application/json")
          |> put_req_header("webhook-id", webhook_id)
          |> put_req_header("webhook-timestamp", timestamp)
          |> put_req_header("webhook-signature", invalid_signature <> " " <> valid_signature)
          |> post("/webhooks/polar", payload)

        assert response(conn, 202) == ""
      end)
    end

    test "returns 503 when the webhook secret is not configured", %{conn: conn} do
      Application.delete_env(:operately, :polar_webhook_secret)
      payload = ~s({"type":"customer.state_changed","data":{"id":"evt_123"}})

      conn =
        conn
        |> signed_webhook_request(payload, secret: @secret)
        |> post("/webhooks/polar", payload)

      assert response(conn, 503) == ""
      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end

    test "returns 400 when the payload type is missing", %{conn: conn} do
      payload = ~s({"data":{"id":"evt_123"}})

      conn =
        conn
        |> signed_webhook_request(payload)
        |> post("/webhooks/polar", payload)

      assert response(conn, 400) == ""
      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end

    test "returns 400 for invalid json payloads", %{conn: conn} do
      payload = ~s({"type":"customer.state_changed","data":)

      assert_error_sent 400, fn ->
        conn
        |> signed_webhook_request(payload)
        |> post("/webhooks/polar", payload)
      end

      assert Repo.aggregate(WebhookEvent, :count, :id) == 0
    end
  end

  defp signed_webhook_request(conn, payload, opts \\ []) do
    webhook_id = Keyword.get(opts, :webhook_id, "msg_123")
    timestamp = Keyword.get(opts, :timestamp, "#{System.system_time(:second)}")
    secret = Keyword.get(opts, :secret, @secret)

    conn
    |> put_req_header("content-type", "application/json")
    |> put_req_header("webhook-id", webhook_id)
    |> put_req_header("webhook-timestamp", timestamp)
    |> put_req_header("webhook-signature", signature_header(webhook_id, timestamp, payload, secret))
  end

  defp signature_header(webhook_id, timestamp, payload, secret \\ @secret) do
    signature =
      :crypto.mac(:hmac, :sha256, secret, webhook_id <> "." <> timestamp <> "." <> payload)
      |> Base.encode64()

    "v1," <> signature
  end
end
