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

  for {language, locale} <- [{"pt-BR", "pt_BR"}, {"de", "de"}, {"ru", "ru"}, {"fr", "fr"}, {"es", "es"}] do
    describe "#{language} resolve/1" do
      test "uses English when no preference is saved" do
        assert EffectiveLanguage.resolve(%Person{language: nil}) == "en"
        assert EffectiveLanguage.resolve(nil) == "en"
      end

      test "uses English for unsupported preferences" do
        assert EffectiveLanguage.resolve(%Person{language: "nl"}) == "en"
      end

      test "uses the saved preference without loading a company" do
        assert EffectiveLanguage.resolve(%Person{language: unquote(language)}) == unquote(language)
      end

      test "uses the saved preference for companies with no experimental features" do
        ctx = Factory.setup(%{})
        {:ok, person} = Operately.People.update_person(ctx.creator, %{language: unquote(language)})
        person = %{person | company: %Company{enabled_experimental_features: []}}

        assert EffectiveLanguage.resolve(person) == unquote(language)
      end
    end

    describe "#{language} with_locale/2" do
      test "scopes Gettext to the recipient language and restores the previous locale" do
        person = %Person{language: unquote(language)}

        result =
          EffectiveLanguage.with_locale(person, fn ->
            assert Gettext.get_locale(@backend) == unquote(locale)
            :rendered
          end)

        assert result == :rendered
        assert Gettext.get_locale(@backend) == "en"
      end

      test "restores the previous locale when rendering fails" do
        person = %Person{language: unquote(language)}

        assert_raise RuntimeError, "boom", fn ->
          EffectiveLanguage.with_locale(person, fn ->
            assert Gettext.get_locale(@backend) == unquote(locale)
            raise "boom"
          end)
        end

        assert Gettext.get_locale(@backend) == "en"
      end

      test "does not use a previous recipient's locale for the next render" do
        first = %Person{language: unquote(language)}
        second = %Person{language: nil}

        EffectiveLanguage.with_locale(first, fn ->
          assert Gettext.get_locale(@backend) == unquote(locale)
        end)

        EffectiveLanguage.with_locale(second, fn ->
          assert Gettext.get_locale(@backend) == "en"
        end)

        assert Gettext.get_locale(@backend) == "en"
      end
    end

    describe "#{language} put_request_locale/1" do
      test "ignores browser language headers by using only the saved preference" do
        person = %Person{language: nil}

        assert EffectiveLanguage.put_request_locale(person) == "en"
        assert Gettext.get_locale(@backend) == "en"
      end
    end
  end
end
