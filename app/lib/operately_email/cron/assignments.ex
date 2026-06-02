defmodule OperatelyEmail.Cron.Assignments do
  use Oban.Worker, queue: :mailer

  alias Operately.People.{Person, Account}
  alias Operately.Repo

  require Logger

  @impl Oban.Worker
  def perform(_) do
    send_assignments()
  end

  def send_assignments do
    people = people_who_want_assignment_emails()

    Enum.each(people, fn person ->
      catch_and_log_errors(fn ->
        OperatelyEmail.Emails.AssignmentsEmail.send(person)
      end)
    end)

    :ok
  end

  defp catch_and_log_errors(cb) do
    try do
      cb.()
    rescue
      e -> Logger.error("Error in OperatelyEmail.Cron.Assignments: #{inspect(e)}")
    end
  end

  def people_who_want_assignment_emails do
    import Ecto.Query, only: [from: 2]

    from(
      p in Person,
      inner_join: a in Account, on: p.account_id == a.id,
      where: not is_nil(a.email),
      where: fragment("COALESCE((?->'notifications'->>'notify_about_assignments')::boolean, true)", p.preferences)
    )
    |> Repo.all()
    |> Repo.preload([:account])
    |> Repo.preload([:company])
  end

end
