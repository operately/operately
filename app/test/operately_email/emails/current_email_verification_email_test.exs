defmodule OperatelyEmail.Emails.CurrentEmailVerificationEmailTest do
  use Operately.DataCase
  import Swoosh.TestAssertions
  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.CurrentEmailVerificationEmail

  test "recipient language is scoped, literal values survive, and changing preferences selects English" do
    ctx = Factory.setup(%{})
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    account = Operately.Repo.preload(person, :account).account
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    for {language, subject} <- [{"pt-BR", "Código de verificação do e-mail atual"}, {"en", "Operately current email verification code"}] do
      {:ok, _} = Operately.People.update_person(person, %{language: language})
      assert {:ok, _} = CurrentEmailVerificationEmail.send(account.email, "<new>@example.com", "ABC123")

      assert_email_sent(fn email ->
        assert email.subject =~ subject
        assert email.text_body =~ "ABC-123"
        assert email.html_body =~ "ABC-123"
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
