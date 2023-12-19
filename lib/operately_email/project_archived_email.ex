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
      url: OperatelyEmail.project_url(project.id),
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectArchived.html(assigns),
      text_body: OperatelyEmail.Views.ProjectArchived.text(assigns)
    )
  end

  def subject(company, author, project) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(author)} archived the #{project.name} project in Operately"
  end
end
