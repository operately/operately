defmodule OperatelyEmail.ProjectStatusUpdateAcknowledgedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    author = Operately.People.get_person!(activity.author_id)
    update = Operately.Updates.get_update!(activity.content["status_update_id"])
    project = Operately.Projects.get_project!(update.updatable_id)
    email = compose(project, update, author, person)

    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(project, update, author, recipient) do
    import Bamboo.Email

    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      company: company,
      project: project,
      status_update: update,
      author: Person.short_name(author),
      project_url: project_url(project),
      cta_url: cta_url(project, update),
      title: subject(company, author, project)
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectStatusUpdateAcknowledged.html(assigns),
      text_body: OperatelyEmail.Views.ProjectStatusUpdateAcknowledged.text(assigns)
    )
  end

  def sender(company) do
    {
      "Operately (#{company.name})", 
      Application.get_env(:operately, :notification_email)
    }
  end

  def cta_url(project, status_update) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/status_updates/#{status_update.id}"
  end

  def subject(company, author, project) do
    "#{org_name(company)}: #{Person.short_name(author)} acknowledged your status update for #{project.name}"
  end

  def org_name(company) do
    "Operately (#{company.name})"
  end

  def project_url(project) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}"
  end
end
