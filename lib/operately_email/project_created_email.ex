defmodule OperatelyEmail.ProjectCreatedEmail do
  use Oban.Worker

  def perform(job) do
    update_id = job.args["update_id"]
    update = Operately.Updates.get_update!(update_id)
    recipients = Operately.Updates.list_people_who_should_be_notified(update)

    Enum.each(recipients, fn recipient ->
      send_email(update, recipient)
    end)
  end

  def send_email(update, recipient) do
    email = compose(update, recipient)
    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(update, recipient) do
    import Bamboo.Email

    author = Operately.Repo.preload(update, :author).author
    company = Operately.Repo.preload(author, :company).company
    project = Operately.Projects.get_project!(update.updatable_id)
    short_name = Operately.People.Person.short_name(author)
    role = Operately.Projects.get_contributor_role!(project, recipient.id) |> stringify_role()
    author_role = Operately.Projects.get_contributor_role!(project, author.id) |> stringify_role()

    assigns = %{
      title: subject(company, short_name, project, role),
      author: short_name,
      role: role,
      author_role: author_role,
      project: project,
      url: project_url(project)
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject(company, short_name, project, role),
      html_body: OperatelyEmail.Views.ProjectCreated.html(assigns),
      text_body: OperatelyEmail.Views.ProjectCreated.text(assigns)
    )
  end

  def sender(company) do
    {
      org_name(company),
      Application.get_env(:operately, :notification_email)
    }
  end

  def subject(company, short_name, project, role) do
    "#{org_name(company)}: #{short_name} created the #{project.name} project in Operately and assigned you as the #{role}"
  end

  def org_name(company) do
    "Operately (#{company.name})"
  end

  def project_url(project) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}"
  end

  def stringify_role(role) do
    case role do
      :champion -> "Champion"
      :reviewer -> "Reviewer"
      :contributor -> "Contributor"
    end
  end
end
