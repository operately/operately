defmodule Operately.SystemSettings.EncryptedMapTest do
  use ExUnit.Case

  alias Operately.SystemSettings.EncryptedMap
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
    value = %{"smtp_password" => "secret", "nested" => %{"key" => "value"}}

    assert {:ok, dumped} = EncryptedMap.dump(value)
    assert is_binary(dumped)
    assert {:ok, loaded} = EncryptedMap.load(dumped)
    assert loaded == value
  end

  test "dumping nil encrypts empty map" do
    assert {:ok, dumped} = EncryptedMap.dump(nil)
    assert {:ok, loaded} = EncryptedMap.load(dumped)
    assert loaded == %{}
  end

  test "load returns error for invalid payload" do
    assert :error = EncryptedMap.load(<<1, 2, 3>>)
  end
end
