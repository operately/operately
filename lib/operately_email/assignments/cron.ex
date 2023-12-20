defmodule OperatelyEmail.Assignments.Cron do
  use Oban.Worker, queue: :mailer

  alias Operately.People.{Person, Account}
  alias Operately.Repo

  @impl Oban.Worker
  def perform(_) do
    if is_workday?() do
      send_assignments()
    else
      :ok
    end
  end

  def send_assignments do
    people_who_want_assignment_emails() 
    |> Enum.each(&OperatelyEmail.Emails.AssignmentsEmail.send/1)

    :ok
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
