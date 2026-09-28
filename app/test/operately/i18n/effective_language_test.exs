defmodule Operately.I18n.EffectiveLanguageTest do
  use Operately.DataCase, async: true

  alias Operately.Companies.Company
  alias Operately.I18n.EffectiveLanguage
  alias Operately.People.Person
  alias Operately.Support.Factory

  @backend OperatelyWeb.Gettext

  setup do
    previous = Gettext.get_locale(@backend)
    Gettext.put_locale(@backend, "en")
    on_exit(fn -> Gettext.put_locale(@backend, previous) end)
    :ok
  end

  describe "resolve/2" do
    test "uses English when no preference is saved" do
      person = %Person{language: nil}
      company = enabled_company()

      assert EffectiveLanguage.resolve(person, company) == "en"
      assert EffectiveLanguage.resolve(nil, company) == "en"
      assert EffectiveLanguage.resolve(person, nil) == "en"
    end

    test "uses English for unsupported preferences even when the flag is on" do
      person = %Person{language: "fr"}
      company = enabled_company()

      assert EffectiveLanguage.resolve(person, company) == "en"
    end

    test "uses an explicit supported preference when the flag is on" do
      person = %Person{language: "pt-BR"}
      company = enabled_company()

      assert EffectiveLanguage.resolve(person, company) == "pt-BR"
    end

    test "forces English when the flag is off without dropping the saved preference" do
      person = %Person{language: "pt-BR"}
      company = %Company{enabled_experimental_features: []}

      assert person.language == "pt-BR"
      assert EffectiveLanguage.resolve(person, company) == "en"
    end
  end

  describe "resolve/1" do
    test "loads the company from the person when it is not passed in" do
      ctx =
        Factory.setup(%{})
        |> Factory.enable_feature("i18n")

      {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})

      assert EffectiveLanguage.resolve(person) == "pt-BR"
    end

    test "keeps a saved preference after the flag is disabled" do
      ctx =
        Factory.setup(%{})
        |> Factory.enable_feature("i18n")

      {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
      ctx = Factory.disable_feature(ctx, "i18n")
      person = Operately.Repo.reload(person)

      assert person.language == "pt-BR"
      assert EffectiveLanguage.resolve(person, ctx.company) == "en"
    end
  end

  describe "with_locale/2" do
    test "scopes Gettext to the recipient language and restores the previous locale" do
      person = %Person{language: "pt-BR", company: enabled_company()}

      result =
        EffectiveLanguage.with_locale(person, fn ->
          assert Gettext.get_locale(@backend) == "pt_BR"
          :rendered
        end)

      assert result == :rendered
      assert Gettext.get_locale(@backend) == "en"
    end

    test "restores the previous locale when rendering fails" do
      person = %Person{language: "pt-BR", company: enabled_company()}

      assert_raise RuntimeError, "boom", fn ->
        EffectiveLanguage.with_locale(person, fn ->
          assert Gettext.get_locale(@backend) == "pt_BR"
          raise "boom"
        end)
      end

      assert Gettext.get_locale(@backend) == "en"
    end

    test "does not use a previous recipient's locale for the next render" do
      first = %Person{language: "pt-BR", company: enabled_company()}
      second = %Person{language: nil, company: enabled_company()}

      EffectiveLanguage.with_locale(first, fn ->
        assert Gettext.get_locale(@backend) == "pt_BR"
      end)

      EffectiveLanguage.with_locale(second, fn ->
        assert Gettext.get_locale(@backend) == "en"
      end)

      assert Gettext.get_locale(@backend) == "en"
    end
  end

  describe "put_request_locale/2" do
    test "ignores browser language headers by using only the saved preference and flag" do
      person = %Person{language: nil, company: enabled_company()}

      assert EffectiveLanguage.put_request_locale(person, enabled_company()) == "en"
      assert Gettext.get_locale(@backend) == "en"
    end
  end

  defp enabled_company do
    %Company{enabled_experimental_features: ["i18n"]}
  end
end
