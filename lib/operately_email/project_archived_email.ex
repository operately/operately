defmodule OperatelyEmail.ProjectArchivedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    project = Operately.Projects.get_project!(activity.content["project_id"])
    email = compose(author, project, person)

    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(author, project, recipient) do
    import Bamboo.Email

    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      title: subject(company, author, project),
      author: author,
      project: project,
      url: project_url(project)
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectArchived.html(assigns),
      text_body: OperatelyEmail.Views.ProjectArchived.text(assigns)
    )
  end

  def sender(company) do
    {
      org_name(company),
      Application.get_env(:operately, :notification_email)
    }
  end

  def subject(company, author, project) do
    "#{org_name(company)}: #{Person.short_name(author)} archived the #{project.name} project in Operately"
  end

  def org_name(company) do
    "Operately (#{company.name})"
  end

  def project_url(project) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}"
  end
end
