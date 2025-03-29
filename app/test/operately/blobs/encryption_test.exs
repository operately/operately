defmodule Operately.Blobs.EncryptionTest do
  use Operately.DataCase

  alias Operately.Blobs.Encryption

  test "works with openssl generated keys" do
    # generated with: openssl rand -base64 32
    key = "MZ7Oq1rtQ0edlR1RAdxrNxOBQpx94In9M7OfzlsMRqg="

    assert {:ok, encrypted} = Encryption.encrypt_raw(key, "test-value")
    assert {:ok, decrypted} = Encryption.decrypt_raw(key, encrypted)

    assert decrypted == "test-value"
  end

  test "raises error on invalid token" do
    assert {:error, :invalid_token} = Encryption.decrypt_raw("garbage", "test-value")
  end

  test "raises error if the secret key is not provided" do
    assert {:error, :invalid_token} = Encryption.decrypt_raw(nil, "test-value")
  end

  test "raises error if the secret key is not invalid" do
    # generated with: openssl rand -hex 32
    key = "d7bec605bbd44ad6d9f08d9e4c694a939ff08385ddb94a3f3f8f47b7e3d29c15"
    assert {:error, :invalid_token} = Encryption.encrypt_raw(key, "test-value")
  end
end
