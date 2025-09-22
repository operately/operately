defmodule Operately.Blobs.TokensTest do
  use Operately.DataCase

  alias Operately.Blobs.Tokens

  test "encryption and validation" do
    token = Tokens.gen_upload_token("test.txt")

    assert Tokens.validate("upload", "test.txt", token) == :ok
  end

  test "returns error on garbage data" do
    token = "garbage"

    assert Tokens.validate("upload", "test.txt", token) == {:error, :invalid_token}
  end

  test "returns error even for base64 valid garbage" do
    token = Base.encode64("garbage")

    assert Tokens.validate("upload", "test.txt", token) == {:error, :invalid_token}
  end

  test "gen_get_token generates consistent tokens within same 2-hour window" do
    # Generate multiple tokens for the same path within a short time period
    token1 = Tokens.gen_get_token("test-path")

    # Small delay
    Process.sleep(1000)

    token2 = Tokens.gen_get_token("test-path")

    # Tokens should be identical due to cache-friendly time rounding
    assert token1 == token2
  end

  test "cache-friendly tokens remain valid for expected duration" do
    path = "test-validation-path"
    token = Tokens.gen_get_token(path)

    # Token should be valid immediately
    assert Tokens.validate("get", path, token) == :ok

    # Token should still be valid after a short delay
    Process.sleep(100)
    assert Tokens.validate("get", path, token) == :ok
  end
end
