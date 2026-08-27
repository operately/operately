defmodule Operately.VersionTest do
  use ExUnit.Case, async: false

  setup do
    original = System.get_env("OPERATELY_VERSION")

    on_exit(fn ->
      if original do
        System.put_env("OPERATELY_VERSION", original)
      else
        System.delete_env("OPERATELY_VERSION")
      end
    end)

    :ok
  end

  test "version is the compiled build identifier" do
    System.put_env("OPERATELY_VERSION", "v1.8.0")

    assert Operately.version() == "dev-version"
  end

  test "release_version is OPERATELY_VERSION when set" do
    System.put_env("OPERATELY_VERSION", "v1.8.0")

    assert Operately.release_version() == "v1.8.0"
  end

  test "release_version is nil when OPERATELY_VERSION is unset" do
    System.delete_env("OPERATELY_VERSION")

    assert Operately.release_version() == nil
  end

  test "release_version is nil when OPERATELY_VERSION is blank" do
    System.put_env("OPERATELY_VERSION", "")

    assert Operately.release_version() == nil
  end
end
