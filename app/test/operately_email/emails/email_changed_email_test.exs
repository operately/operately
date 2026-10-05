defmodule OperatelyEmail.Emails.EmailChangedEmailTest do
  use Operately.DataCase
  import Swoosh.TestAssertions
  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.EmailChangedEmail

  test "recipient language is scoped, literal values survive, and flag rollback restores English" do
    ctx = Factory.setup(%{}) |> Factory.enable_feature("i18n")
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    account = Operately.Repo.preload(person, :account).account
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    for {enabled, subject} <- [{true, "Seu e-mail do Operately foi alterado"}, {false, "Your Operately email has changed"}] do
      unless enabled, do: Operately.Companies.disable_experimental_feature(ctx.company, "i18n")
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

    assert Operately.Repo.reload!(person).language == "pt-BR"
  end
end
