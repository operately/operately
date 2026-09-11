defmodule Operately.People.EmailChangedEmailWorker do
  use Oban.Worker, queue: :mailer

  def perform(%Oban.Job{args: %{"old_email" => old_email, "new_email" => new_email}}) do
    OperatelyEmail.Emails.EmailChangedEmail.send(old_email, new_email)
  end
end
