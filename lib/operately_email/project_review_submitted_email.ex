defmodule OperatelyEmail.ProjectReviewSubmittedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    update = Operately.Updates.get_update!(activity.content["review_id"])
    project = Operately.Projects.get_project!(update.updatable_id)
    email = compose(project, update, person)

    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(project, update, recipient) do
    import Bamboo.Email

    author = Operately.Repo.preload(update, :author).author
    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      company: company,
      project: project,
      review: update,
      author: Person.short_name(author),
      project_url: OperatelyEmail.project_url(project.id),
      cta_url: OperatelyEmail.project_review_url(project.id, update.id),
      title: subject(company, author, project)
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectReviewSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectReviewSubmitted.text(assigns)
    )
  end

  def subject(company, author, project) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(author)} submitted a review for #{project.name}"
  end
end
