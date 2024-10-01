defmodule Operately.Demo do
  alias Operately.Demo.{Resources, Company, People, Spaces, Goals, Projects}

  def run(account, company_name, title) do
    verify_if_demo_can_be_run()

    data = Operately.Demo.Data.data()
    resources = Resources.init()

    {:ok, context} = Operately.Repo.transaction(fn ->
      resources
      |> Company.create_company(account, company_name, title)
      |> People.create_people(data.people)
      |> Spaces.create_spaces(data.spaces)
      |> Goals.create_goals(data.goals)
      |> Projects.create_projects(data.projects)
    end)

    :timer.sleep(2000) # wait for background job to finish
    mark_all_notifications_as_read(context)

    {:ok, context.company}
  end

  defp mark_all_notifications_as_read(context) do
    {:ok, _} = Operately.Notifications.mark_all_as_read(context.owner)
  end

  defp verify_if_demo_can_be_run do
    if Application.get_env(:operately, :demo_builder_allowed) do
      :ok
    else
      raise "Demo builder is not allowed"
    end
  end

end
