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
end
