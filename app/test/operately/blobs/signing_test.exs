defmodule Operately.Blobs.SigningTest do
  use Operately.DataCase

  alias Operately.Blobs.Signing

  # Base64 encoded 32-byte key
  @test_key "dGVzdC1rZXktZm9yLXNpZ25pbmctdGVzdHMtMzJieXRlc2xvbmc="

  test "sign/2 and verify/2 work correctly" do
    payload = "test payload"

    {:ok, signed_token} = Signing.sign(@test_key, payload)
    {:ok, verified_payload} = Signing.verify(@test_key, signed_token)

    assert verified_payload == payload
  end

  test "signing the same payload produces the same token (cache-friendly)" do
    payload = "consistent payload"

    {:ok, token1} = Signing.sign(@test_key, payload)
    {:ok, token2} = Signing.sign(@test_key, payload)

    assert token1 == token2
  end

  test "verification fails with invalid token" do
    assert Signing.verify(@test_key, "invalid-token") == {:error, :invalid_token}
  end

  test "verification fails with modified token" do
    payload = "original payload"
    {:ok, signed_token} = Signing.sign(@test_key, payload)

    # Modify the token slightly
    modified_token = String.replace(signed_token, "A", "B", global: false)

    assert Signing.verify(@test_key, modified_token) == {:error, :invalid_token}
  end

  test "verification fails with wrong key" do
    payload = "secret payload"
    # Different key
    wrong_key = "d3Jvbmcta2V5LWZvci1zaWduaW5nLXRlc3RzLTMyYnl0ZXNsb25n"

    {:ok, signed_token} = Signing.sign(@test_key, payload)

    assert Signing.verify(wrong_key, signed_token) == {:error, :invalid_token}
  end

  test "handles complex JSON payload" do
    payload =
      Jason.encode!(%{
        operation: "get",
        path: "/test/file.txt",
        expires_at: 1_234_567_890,
        metadata: %{size: 1024, type: "text/plain"}
      })

    {:ok, signed_token} = Signing.sign(@test_key, payload)
    {:ok, verified_payload} = Signing.verify(@test_key, signed_token)

    assert verified_payload == payload

    # Verify we can decode the JSON back
    {:ok, decoded} = Jason.decode(verified_payload)
    assert decoded["operation"] == "get"
    assert decoded["path"] == "/test/file.txt"
  end
end
