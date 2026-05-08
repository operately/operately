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
end
