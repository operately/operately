defmodule OperatelyEmail.Emails.EmailChangeCodeEmailTest do
  use Operately.DataCase
  import Swoosh.TestAssertions
  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.EmailChangeCodeEmail

  test "recipient language is scoped, literal values survive, and changing preferences selects English" do
    ctx = Factory.setup(%{})
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    account = Operately.Repo.preload(person, :account).account
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    for {language, subject} <- [{"pt-BR", "Código de alteração de e-mail"}, {"en", "Operately email change code"}] do
      {:ok, _} = Operately.People.update_person(person, %{language: language})
      assert {:ok, _} = EmailChangeCodeEmail.send("<new>@example.com", "ABC123", account)

      assert_email_sent(fn email ->
        assert email.subject =~ subject
        assert email.text_body =~ "ABC-123"
        assert email.html_body =~ "ABC-123"
        refute email.text_body =~ "%{"
        true
      end)

      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous
    end

    assert Operately.Repo.reload!(person).language == "en"
  end
end
