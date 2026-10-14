defmodule OperatelyEmail.Emails.ResetPasswordEmailTest do
  use Operately.DataCase
  import Swoosh.TestAssertions
  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.ResetPasswordEmail

  test "recipient language is scoped, literal values survive, and changing preferences selects English" do
    ctx = Factory.setup(%{})
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    account = Operately.Repo.preload(person, :account).account
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    for {language, subject} <- [{"pt-BR", "Instruções para redefinir a senha"}, {"en", "Reset password instructions"}] do
      {:ok, _} = Operately.People.update_person(person, %{language: language})
      assert {:ok, _} = ResetPasswordEmail.send(account, "literal-token-123")

      assert_email_sent(fn email ->
        assert email.subject =~ subject
        assert email.text_body =~ "literal-token-123"
        assert email.html_body =~ "literal-token-123"
        refute email.text_body =~ "%{"
        true
      end)

      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous
    end

    assert Operately.Repo.reload!(person).language == "en"
  end
end
