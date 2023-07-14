defmodule OperatelyEmail.HourlyWorker do
  use Oban.Worker, queue: :mailer

  alias Operately.People.{Person, Account}
  alias Operately.Repo

  @impl Oban.Worker
  def perform(_) do
    people_who_want_assignment_emails() |> Enum.each(fn person ->
      case OperatelyEmail.Email.assignments_email(person) do
        {:ok, email} ->
          IO.puts("Sending assignments email to #{person.account.email}")
          OperatelyEmail.Mailer.deliver_now(email)
        :no_assignments ->
          IO.puts("No assignments for #{person.account.email}")
        {:error, error} ->
          IO.puts("Error sending assignments email to #{person.account.email}: #{inspect(error)}")
      end
    end)

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
end
