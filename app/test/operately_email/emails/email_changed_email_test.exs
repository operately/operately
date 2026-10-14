defmodule OperatelyEmail.Emails.EmailChangedEmailTest do
  use Operately.DataCase
  import Swoosh.TestAssertions
  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.EmailChangedEmail

  test "recipient language is scoped, literal values survive, and changing preferences selects English" do
    ctx = Factory.setup(%{})
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    account = Operately.Repo.preload(person, :account).account
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    for {language, subject} <- [{"pt-BR", "Seu e-mail do Operately foi alterado"}, {"en", "Your Operately email has changed"}] do
      {:ok, _} = Operately.People.update_person(person, %{language: language})
      assert {:ok, _} = EmailChangedEmail.send("old@example.com", "<new>@example.com", account)

      assert_email_sent(fn email ->
        assert email.subject =~ subject
        assert email.text_body =~ "<new>@example.com"
        assert email.html_body =~ "&lt;new&gt;@example.com"
        refute email.html_body =~ "<new>"
        refute email.text_body =~ "%{"
        true
      end)

      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous
    end

    assert Operately.Repo.reload!(person).language == "en"
  end
end
