defmodule OperatelyEmail.Assignments.Cron do
  use Oban.Worker, queue: :mailer

  alias Operately.People.{Person, Account}
  alias Operately.Repo

  require Logger

  @impl Oban.Worker
  def perform(_) do
    if is_workday?() do
      send_assignments()
    else
      :ok
    end
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
      e -> Logger.error("Error in OperatelyEmail.Assignments.Cron: #{inspect(e)}")
    end
  end

  def people_who_want_assignment_emails do
    import Ecto.Query, only: [from: 2]

    from(
      p in Person,
      inner_join: a in Account, on: p.account_id == a.id,
      where: not is_nil(a.email),
      where: p.notify_about_assignments == true
    )
    |> Repo.all()
    |> Repo.preload([:account])
    |> Repo.preload([:company])
  end

  def is_workday? do
    Date.day_of_week(Date.utc_today()) in [1, 2, 3, 4, 5]
  end

end
