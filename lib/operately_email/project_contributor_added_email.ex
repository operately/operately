defmodule OperatelyEmail.ProjectContributorAddedEmail do
  use Oban.Worker

  def perform(job) do
    update_id = job.args["update_id"]
    update = Operately.Updates.get_update!(update_id)
    recipient = Operately.People.get_person!(update.content["contributor_id"])

    send_email(update, recipient)
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
    contributor = Operately.Projects.get_contributor!(person_id: recipient.id, project_id: project.id)
    role = stringify_role(contributor.role)
    responsibility = construct_responsibility(contributor)

    assigns = %{
      title: subject(company, short_name, project, role),
      author: short_name,
      role: role,
      responsibility: responsibility,
      project: project,
      url: project_url(project)
    }

    new_email(
      to: recipient.email,
      from: sender(company),
      subject: subject(company, short_name, project, role),
      html_body: OperatelyEmail.Views.ProjectContributorAdded.html(assigns),
      text_body: OperatelyEmail.Views.ProjectContributorAdded.text(assigns)
    )
  end

  def sender(company) do
    {
      org_name(company),
      Application.get_env(:operately, :notification_email)
    }
  end

  def subject(company, short_name, project, role) do
    "#{org_name(company)}: #{short_name} added you as a #{role} on #{project.name}"
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

  def construct_responsibility(contributor) do
    case contributor.role do
      :champion -> "As a champion, you are responsible for leading the project, defining the scope, goals and timeline, and providing regular updates."
      :reviewer -> "As a reviewer, you are responsible for reviewing the progress of the project, providing feedback, and approving the final deliverables."
      :contributor -> "You are responsible for: #{contributor.responsibility}"
    end
  end
end
