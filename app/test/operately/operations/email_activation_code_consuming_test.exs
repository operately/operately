defmodule Operately.Operations.EmailActivationCodeConsumingTest do
  use Operately.DataCase

  alias Operately.Operations.EmailActivationCodeConsuming
  alias Operately.People.EmailActivationCode

  test "accepts a raw code and deletes it after use" do
    {:ok, activation} = EmailActivationCode.create("hello@text.localhost")

    assert {:ok, consumed} = EmailActivationCodeConsuming.run("hello@text.localhost", activation.code)
    assert consumed.id == activation.id
    assert Repo.get(EmailActivationCode, activation.id) == nil
  end

  test "accepts a hyphenated code" do
    {:ok, activation} = EmailActivationCode.create("hello@text.localhost")
    hyphenated = String.slice(activation.code, 0, 3) <> "-" <> String.slice(activation.code, 3, 3)

    assert {:ok, _consumed} = EmailActivationCodeConsuming.run("hello@text.localhost", hyphenated)
  end

  test "returns invalid when the code has expired" do
    {:ok, activation} = EmailActivationCode.create("hello@text.localhost")

    activation
    |> Ecto.Changeset.change(expires_at: DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.add(-1, :second))
    |> Repo.update!()

    assert {:error, :invalid} = EmailActivationCodeConsuming.run("hello@text.localhost", activation.code)
  end

  test "rejects reusing the same code" do
    {:ok, activation} = EmailActivationCode.create("hello@text.localhost")

    assert {:ok, _consumed} = EmailActivationCodeConsuming.run("hello@text.localhost", activation.code)
    assert {:error, :not_found} = EmailActivationCodeConsuming.run("hello@text.localhost", activation.code)
  end

  test "a competing consumer waits for the lock and cannot reuse a consumed code" do
    alias Ecto.Adapters.SQL.Sandbox

    Sandbox.unboxed_run(Repo, fn ->
      {:ok, activation} = EmailActivationCode.create("concurrent-#{Ecto.UUID.generate()}@example.com")
      parent = self()

      try do
        first =
          Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn ->
              Repo.transaction(fn ->
                assert {:ok, _} = EmailActivationCodeConsuming.run(activation.email, activation.code)
                send(parent, {:consumed, self()})

                receive do
                  :commit -> :ok
                after
                  5_000 -> raise "consumer was not released"
                end
              end)
            end)
          end)

        assert_receive {:consumed, consumer}, 5_000

        second =
          Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn -> EmailActivationCodeConsuming.run(activation.email, activation.code) end)
          end)

        assert Task.yield(second, 50) == nil
        send(consumer, :commit)
        assert {:ok, :ok} = Task.await(first)
        assert {:error, :not_found} = Task.await(second)
      after
        Repo.delete_all(from c in EmailActivationCode, where: c.id == ^activation.id)
      end
    end)
  end

  test "matches legacy mixed-case records with surrounding whitespace" do
    {:ok, activation} = EmailActivationCode.create("\t Legacy@Example.com \n\u00A0")
    assert {:ok, consumed} = EmailActivationCodeConsuming.run("legacy@example.com", activation.code)
    assert consumed.id == activation.id
  end

  test "rejects arbitrary separators and malformed code input" do
    {:ok, activation} = EmailActivationCode.create("hello@example.com")
    malformed = String.slice(activation.code, 0, 3) <> "!" <> String.slice(activation.code, 3, 3)

    for code <- [nil, "", malformed, 123_456, "abc123"] do
      assert {:error, :invalid_code} = EmailActivationCodeConsuming.run(activation.email, code)
    end

    assert Repo.get(EmailActivationCode, activation.id)
  end
end
