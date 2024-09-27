defmodule Operately.Demo do
  alias Operately.Demo.{Company, Employees, Spaces, Goals}

  def run(account, company_name, title) do
    verify_if_demo_can_be_run()

    context = %{
      account: account,
      company_name: company_name,
      title: title,
    }

    {:ok, context} = Operately.Repo.transaction(fn ->
      context
      |> Company.create_company()
      |> Employees.set_owner_avatar()
      |> Employees.create_employees()
      |> Spaces.create_spaces()
      |> Goals.create_goals_and_projects()
    end)

    :timer.sleep(2000) # wait for background job to finish
    mark_all_notifications_as_read(context)

    {:ok, context.company}
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

  def verify_if_demo_can_be_run do
    if Application.get_env(:operately, :demo_builder_allowed) do
      :ok
    else
      raise "Demo builder is not allowed"
    end
  end

end
