defmodule Operately.SystemSettings.EncryptedEmailSecretsTest do
  use ExUnit.Case

  alias Operately.SystemSettings.EmailSecrets
  alias Operately.SystemSettings.EncryptedEmailSecrets
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

  test "dump/load round trip" do
    value = %EmailSecrets{smtp_password: "secret", sendgrid_api_key: "sg-api-key"}

    refute is_binary(value)

    assert {:ok, dumped} = EncryptedEmailSecrets.dump(value)
    assert is_binary(dumped)

    assert {:ok, loaded} = EncryptedEmailSecrets.load(dumped)
    assert loaded == value
  end

  test "dumping nil encrypts empty map" do
    assert {:ok, dumped} = EncryptedEmailSecrets.dump(nil)
    assert {:ok, loaded} = EncryptedEmailSecrets.load(dumped)
    assert loaded == %EmailSecrets{}
  end

  test "load returns error for invalid payload" do
    assert :error = EncryptedEmailSecrets.load(<<1, 2, 3>>)
  end
end
