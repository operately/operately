defmodule OperatelyEmail.Emails.EmailActivationCodeEmailTest do
  use Operately.DataCase
  import Swoosh.TestAssertions
  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.EmailActivationCodeEmail

  test "recipient language is scoped, literal values survive, and flag rollback restores English" do
    ctx = Factory.setup(%{}) |> Factory.enable_feature("i18n")
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    account = Operately.Repo.preload(person, :account).account
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    for {enabled, subject} <- [{true, "Código de confirmação"}, {false, "Operately confirmation code"}] do
      unless enabled, do: Operately.Companies.disable_experimental_feature(ctx.company, "i18n")
      assert {:ok, _} = EmailActivationCodeEmail.send(%Operately.People.EmailActivationCode{email: account.email, code: "ABC123"})

      assert_email_sent(fn email ->
        assert email.subject =~ subject
        assert email.text_body =~ "ABC-123"
        assert email.html_body =~ "ABC-123"
        refute email.text_body =~ "%{"
        true
      end)

      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous
    end

    assert Operately.Repo.reload!(person).language == "pt-BR"
  end
end
