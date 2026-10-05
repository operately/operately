defmodule Operately.I18n.AccountLanguageTest do
  use Operately.DataCase, async: true

  alias Operately.I18n.AccountLanguage
  alias Operately.Support.Factory

  test "account emails use a shared effective language and fall back when memberships disagree" do
    ctx = Factory.setup(%{}) |> Factory.enable_feature("i18n")
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    account = Operately.Repo.preload(person, :account).account
    assert AccountLanguage.resolve(account) == "pt-BR"
    assert AccountLanguage.resolve(account.email) == "pt-BR"

    other = Operately.CompaniesFixtures.company_fixture()
    member = Operately.PeopleFixtures.person_fixture(%{company_id: other.id, account_id: account.id})
    assert AccountLanguage.resolve(account) == "en"

    {:ok, other} = Operately.Companies.enable_experimental_feature(other, "i18n")
    {:ok, member} = Operately.People.update_person(member, %{language: "pt-BR"})
    assert AccountLanguage.resolve(account) == "pt-BR"
    Operately.Companies.disable_experimental_feature(other, "i18n")
    assert AccountLanguage.resolve(account) == "en"

    {:ok, _} = Operately.People.update_person(member, %{suspended: true})
    assert AccountLanguage.resolve(account) == "pt-BR"
    Operately.Companies.disable_experimental_feature(ctx.company, "i18n")
    assert AccountLanguage.resolve(account) == "en"
    assert Operately.Repo.reload!(person).language == "pt-BR"
  end

  test "unknown recipients use English and locale is restored on failure" do
    previous = Gettext.get_locale(OperatelyWeb.Gettext)
    assert AccountLanguage.resolve("new@example.com") == "en"

    assert_raise RuntimeError, "render failed", fn ->
      AccountLanguage.with_locale(nil, fn ->
        assert Gettext.get_locale(OperatelyWeb.Gettext) == "en"
        raise "render failed"
      end)
    end

    assert Gettext.get_locale(OperatelyWeb.Gettext) == previous
  end
end
