defmodule OperatelyEmail.Assignments.Cron do
  use Oban.Worker, queue: :mailer

  alias Operately.People.{Person, Account}
  alias Operately.Repo

  @impl Oban.Worker
  def perform(_) do
    people_who_want_assignment_emails() 
    |> Enum.each(&send/1)

    :ok
  end

  def people_who_want_assignment_emails do
    import Ecto.Query

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

  def send(person) do
    result = OperatelyEmail.Assignments.Loader.load(person)

    if result == [] do
      IO.puts("No assignments for #{person.account.email}")
    else
      {:ok, email} = OperatelyEmail.Emails.assignments(person, result)

      OperatelyEmail.Mailer.deliver_now(email)
    end
  end
end
