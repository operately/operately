defmodule Operately.People.EmailChangedEmailWorkerTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo
  import Mock
  import Swoosh.TestAssertions

  alias Operately.People.EmailChangedEmailWorker

  test "notifies the old address without including a verification code" do
    assert {:ok, _} = perform_job(EmailChangedEmailWorker, %{old_email: "old@example.com", new_email: "new@example.com"})

    assert_email_sent(fn email ->
      assert email.to == [{"", "old@example.com"}]
      assert email.text_body =~ "new@example.com"
      refute email.text_body =~ "code"
      true
    end)
  end

  test "returns delivery failures to Oban for retry" do
    with_mock OperatelyEmail.Emails.EmailChangedEmail, send: fn _, _ -> {:error, :smtp_unavailable} end do
      assert {:error, :smtp_unavailable} = perform_job(EmailChangedEmailWorker, %{old_email: "old@example.com", new_email: "new@example.com"})
    end
  end
  test "uses the account identity for language even after its address changes again" do
    ctx = Operately.Support.Factory.setup(%{}) |> Operately.Support.Factory.enable_feature("i18n")
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    args = %{account_id: person.account_id, old_email: "old@example.com", new_email: "previous@example.com"}
    assert {:ok, _} = perform_job(EmailChangedEmailWorker, args)
    assert_email_sent(fn email ->
      assert email.to == [{"", "old@example.com"}]
      assert email.subject == "Seu e-mail do Operately foi alterado"
      assert email.text_body =~ "previous@example.com"
      true
    end)
    Operately.Companies.disable_experimental_feature(ctx.company, "i18n")
    assert {:ok, _} = perform_job(EmailChangedEmailWorker, args)
    assert_email_sent(subject: "Your Operately email has changed")
  end

  test "legacy jobs do not infer account ownership from a potentially reused address" do
    ctx = Operately.Support.Factory.setup(%{}) |> Operately.Support.Factory.enable_feature("i18n")
    Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    assert {:ok, _} = perform_job(EmailChangedEmailWorker, %{old_email: "old@example.com", new_email: ctx.creator.email})
    assert_email_sent(subject: "Your Operately email has changed")
  end

end
