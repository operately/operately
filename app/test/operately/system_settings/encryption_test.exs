defmodule Operately.SystemSettings.EncryptionTest do
  use ExUnit.Case

  alias Operately.SystemSettings.Encryption

  defp clear_key_cache do
    :persistent_term.erase({Encryption, :keys})
  end

  setup do
    System.put_env("SYSTEM_SETTINGS_ENCRYPTION_KEY", "test-encryption-key")
    clear_key_cache()

    on_exit(fn ->
      System.delete_env("SYSTEM_SETTINGS_ENCRYPTION_KEY")
      System.delete_env("SYSTEM_SETTINGS_ENCRYPTION_KEYS")
      clear_key_cache()
    end)

    :ok
  end

  test "encrypt/decrypt round trip" do
    plaintext = "top-secret"
    ciphertext = Encryption.encrypt(plaintext)

    assert {:ok, ^plaintext} = Encryption.decrypt(ciphertext)
  end

  test "decrypt fails with a different key" do
    plaintext = "top-secret"
    ciphertext = Encryption.encrypt(plaintext)

    System.put_env("SYSTEM_SETTINGS_ENCRYPTION_KEY", "another-key")
    clear_key_cache()

    assert {:error, :invalid} = Encryption.decrypt(ciphertext)
  end

  test "decrypt succeeds with key ring regardless of order" do
    System.put_env("SYSTEM_SETTINGS_ENCRYPTION_KEYS", "primary-key,secondary-key")
    System.delete_env("SYSTEM_SETTINGS_ENCRYPTION_KEY")
    clear_key_cache()

    plaintext = "ring-secret"
    ciphertext = Encryption.encrypt(plaintext)

    System.put_env("SYSTEM_SETTINGS_ENCRYPTION_KEYS", "secondary-key,primary-key")
    clear_key_cache()

    assert {:ok, ^plaintext} = Encryption.decrypt(ciphertext)
  end

  test "falls back to secret_key_base when env key is missing" do
    System.delete_env("SYSTEM_SETTINGS_ENCRYPTION_KEY")
    System.delete_env("SYSTEM_SETTINGS_ENCRYPTION_KEYS")
    clear_key_cache()

    plaintext = "fallback-secret"
    ciphertext = Encryption.encrypt(plaintext)

    assert {:ok, ^plaintext} = Encryption.decrypt(ciphertext)
  end
end
