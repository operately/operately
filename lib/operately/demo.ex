defmodule Operately.Demo do
  alias Operately.Demo.{Company, Employees, Spaces, Goals}

  def run(owner_email) do
    context = %{
      account: find_account!(owner_email)
    }

    {:ok, context} = Operately.Repo.transaction(fn ->
      context
      |> Company.create_company()
      |> Employees.set_owner_avatar()
      |> Employees.create_employees()
      |> Spaces.create_spaces()
      |> Goals.create_goals_and_projects()
    end)

    mark_all_notifications_as_read(context)
  end

  def find_account!(email) do
    case Operately.People.get_account_by_email(email) do
      nil -> raise "Account not found"
      account -> account
    end
  end

  def mark_all_notifications_as_read(context) do
    {:ok, _} = Operately.Notifications.mark_all_as_read(context.owner)
  end

end
