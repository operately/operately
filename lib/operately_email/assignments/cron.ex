defmodule OperatelyEmail.Assignments.Cron do
  use Oban.Worker, queue: :mailer

  alias Operately.People.{Person, Account}
  alias Operately.Repo

  @impl Oban.Worker
  def perform(_) do
    people_who_want_assignment_emails() 
    |> Enum.each(&OperatelyEmail.AssignmentsEmail.send/1)

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

end
