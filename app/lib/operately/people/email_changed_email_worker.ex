defmodule Operately.People.EmailChangedEmailWorker do
  use Oban.Worker, queue: :mailer

  def perform(%Oban.Job{args: %{"account_id" => account_id, "old_email" => old_email, "new_email" => new_email}}) do
    account =
      case Operately.People.Account.get(:system, id: account_id) do
        {:ok, account} -> account
        {:error, :not_found} -> nil
      end

    OperatelyEmail.Emails.EmailChangedEmail.send(old_email, new_email, account)
  end

  # Legacy jobs have no stable account identity; deliver to the original address in English.
  def perform(%Oban.Job{args: %{"old_email" => old_email, "new_email" => new_email}}) do
    OperatelyEmail.Emails.EmailChangedEmail.send(old_email, new_email)
  end
end
