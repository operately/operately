defmodule Operately.People.PersonTest do
  use Operately.DataCase, async: true

  alias Operately.People.Person
  alias Operately.People.Preferences

  describe "language" do
    test "starts with no language preference" do
      changeset = Person.changeset(%Person{}, %{})
      person = Ecto.Changeset.apply_changes(changeset)

      assert person.language == nil
      assert Person.language(person) == nil
    end

    test "persists an explicit supported language separately from formatting preferences" do
      changeset =
        Person.changeset(%Person{}, %{
          language: "pt-BR",
          timezone: "America/Sao_Paulo",
          preferences: %{time_format: "hour_24"}
        })

      person = Ecto.Changeset.apply_changes(changeset)

      assert person.language == "pt-BR"
      assert person.timezone == "America/Sao_Paulo"
      assert person.preferences.time_format == :hour_24
    end

    test "accepts API enum atoms for language" do
      changeset = Person.changeset(%Person{}, %{language: :"pt-BR"})
      person = Ecto.Changeset.apply_changes(changeset)

      assert person.language == "pt-BR"
    end

    test "rejects unsupported languages" do
      changeset = Person.changeset(%Person{}, %{language: "fr"})

      refute changeset.valid?
      assert Keyword.has_key?(changeset.errors, :language)
    end

    test "does not change language when only formatting preferences are updated" do
      person = %Person{
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
        preferences: %Preferences{time_format: :hour_24}
      }

      changeset =
        Person.changeset(person, %{
          timezone: "Etc/UTC",
          preferences: %{time_format: "hour_12"}
        })

      updated = Ecto.Changeset.apply_changes(changeset)

      assert updated.language == "pt-BR"
      assert updated.timezone == "Etc/UTC"
      assert updated.preferences.time_format == :hour_12
    end
  end
end
