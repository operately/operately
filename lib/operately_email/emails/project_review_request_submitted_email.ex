defmodule OperatelyEmail.Emails.ProjectReviewRequestSubmittedEmail do
  alias Operately.People.Person

  def send(person, activity) do
    request = Operately.Projects.get_review_request!(activity.content["request_id"])
    project = Operately.Projects.get_project!(request.project_id)

    email = compose(project, request, person)

    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(project, request, champion) do
    import Bamboo.Email

    author = Operately.Repo.preload(request, :author).author
    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      company: company,
      project: project,
      request: request,
      author: Person.short_name(author),
      cta_url: OperatelyEmail.project_review_request_url(project.id, request.id),
      title: subject(company, author, project)
    }

    new_email(
      to: champion.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectReviewRequestSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectReviewRequestSubmitted.text(assigns)
    )
  end

  def subject(company, short_name, project) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(short_name)} requested a review for #{project.name}"
  end
end
