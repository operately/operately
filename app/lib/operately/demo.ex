defmodule Operately.Demo do
  alias Operately.Demo.{Resources, Company, People, Spaces, Goals, Projects, Discussions, ResourceHubs}

  def run(account, company_name, title) do
    run(account, company_name, title, Operately.Demo.Data.data())
  end

  def run(account, company_name, title, data) do
    verify_if_demo_can_be_run()

    resources = Resources.init()

    {:ok, context} =
      Operately.Activities.without_notification_dispatch(fn ->
        Operately.Repo.transaction(fn ->
          resources
          |> Company.create_company(account, company_name, title)
          |> People.create_people(data[:people])
          |> People.create_outside_collaborators(data[:outside_collaborators])
          |> Spaces.create_spaces(data[:spaces])
          |> Goals.create_goals(data[:goals])
          |> Projects.create_projects(data[:projects])
          |> Discussions.create_discussions(data[:discussions])
          |> ResourceHubs.create_documents(data[:documents])
          |> ResourceHubs.create_links(data[:links])
        end)
      end)

    {:ok, context.company}
  end

  defp verify_if_demo_can_be_run do
    if Application.get_env(:operately, :demo_builder_allowed) do
      :ok
    else
      raise "Demo builder is not allowed"
    end
  end
end
