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

  test "works with openssl generated keys" do
    # generated with: openssl rand -base64 32
    key = "MZ7Oq1rtQ0edlR1RAdxrNxOBQpx94In9M7OfzlsMRqg="

    assert {:ok, encrypted} = Tokens.encrypt_raw(key, "test-value")
    assert {:ok, decrypted} = Tokens.decrypt_raw(key, encrypted)

    assert decrypted == "test-value"
  end
end
