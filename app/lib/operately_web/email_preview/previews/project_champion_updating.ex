defmodule OperatelyWeb.EmailPreview.Previews.ProjectChampionUpdating do
  @moduledoc "Mock data for the project champion updating email preview."

  alias OperatelyEmail.Mailers.ActivityMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview
  alias Operately.People.Person

  @project_url "https://app.operately.dev/projects/launch-website"

  def champion_removed do
    context = base_context()

    context
    |> build_email(nil, "removed the champion")
    |> Preview.build("project_champion_updating")
  end

  def champion_assigned_to_you do
    context = base_context()
    person = context.person
    champion = %{id: person.id, full_name: person.full_name}

    context
    |> build_email(champion, "assigned you as the champion")
    |> Preview.build("project_champion_updating")
  end

  def champion_assigned_to_teammate do
    context = base_context()
    champion = person(%{id: "person-003", full_name: "Morgan Lee", email: "morgan@localhost.com"})

    context
    |> build_email(champion, "assigned #{Person.short_name(champion)} as the champion")
    |> Preview.build("project_champion_updating")
  end

  defp build_email(%{company: company, author: author, project: project, person: person}, champion, action) do
    company
    |> Mailer.new()
    |> Mailer.from(author)
    |> Mailer.to(person)
    |> Mailer.subject(where: project.name, who: author, action: action)
    |> Mailer.assign(:author, author)
    |> Mailer.assign(:project, project)
    |> Mailer.assign(:champion, champion)
    |> Mailer.assign(:person, person)
    |> Mailer.assign(:cta_url, @project_url)
  end

  defp base_context do
    company = %{name: "Acme Corporation"}
    author = person(%{id: "person-001", full_name: "Taylor Reed", email: "taylor@localhost.com"})
    person = person(%{id: "person-002", full_name: "Jordan Smith", email: "jordan@localhost.com"})

    project = %{
      id: "proj-001",
      name: "Launch Website Project",
      slug: "launch-website-project"
    }

    %{company: company, author: author, project: project, person: person}
  end

  defp person(%{id: id, full_name: full_name, email: email}) do
    %{id: id, full_name: full_name, email: email}
  end
end
