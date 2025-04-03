defmodule Operately.ShortUuidTest do
  use Operately.DataCase

  test "encode/1 encodes a UUID to a short UUID" do
    1..1000 |> Enum.each(fn _ ->
      uuid = Ecto.UUID.generate()
      short_uuid = Operately.ShortUuid.encode!(uuid)

      assert String.length(short_uuid) <= 22
      assert String.length(short_uuid) >= 19
      assert short_uuid =~ ~r/^[A-Za-z0-9]+$/
    end)
  end

  test "encode/1 returns invalid UUID for non-UUIDs" do
    assert Operately.ShortUuid.encode("not a uuid") == {:error, "Invalid UUID"}
  end

  test "decode/1 decodes a short UUID to a UUID" do
    1..1000 |> Enum.each(fn _ ->
      uuid = Ecto.UUID.generate()
      short_uuid = Operately.ShortUuid.encode!(uuid)

      assert Operately.ShortUuid.decode(short_uuid) == {:ok, uuid}
    end)
  end

  test "decode/1 returns an error for impossibly long short uuids" do
    assert Operately.ShortUuid.decode("A" <> String.duplicate("A", 24)) == {:error, "Invalid short UUID"}
  end

  test "decode/1 returns an error for non-base62 characters" do
    assert Operately.ShortUuid.decode("!@#$%^&*()") == {:error, "Invalid short UUID"}
  end

  test "encoding is performant" do
    {time, _} = :timer.tc(fn ->
      1..1000 |> Enum.each(fn _ ->
        uuid = Ecto.UUID.generate()
        encoded = Operately.ShortUuid.encode!(uuid)
        Operately.ShortUuid.decode(encoded)
      end)
    end)

    assert time < 100_000 # 100ms
  end

  test "encode! raises an error for invalid UUIDs" do
    assert_raise Operately.ShortUuid.ShortUuidError, "Invalid UUID", fn ->
      Operately.ShortUuid.encode!("not a uuid")
    end
  end

  test "decode! raises an error for invalid short UUIDs" do
    assert_raise Operately.ShortUuid.ShortUuidError, "Invalid short UUID", fn ->
      Operately.ShortUuid.decode!("A" <> String.duplicate("A", 24))
    end
  end

end
