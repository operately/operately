defmodule OperatelyEmail.ProjectReviewSubmittedEmail do
  use Oban.Worker
  
  alias Operately.People.Person

  def perform(job) do
    review_id = job.args["review_id"]
    review = Operately.Updates.get_update!(review_id)
    project = Operately.Projects.get_project!(review.updatable_id)
    reviewer = Operately.Projects.get_reviewer(project)

    email = compose(project, review, reviewer)
    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(project, review, reviewer) do
    import Bamboo.Email

    author = Operately.Repo.preload(review, :author).author
    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      company: company,
      project: project,
      review: review,
      author: Person.short_name(author),
      cta_url: cta_url(project, review),
      title: subject(company, author, project)
    }

    new_email(
      to: reviewer.email,
      from: sender(company),
      subject: subject(company, author, project),
      html_body: OperatelyEmail.Views.ProjectReviewSubmitted.html(assigns),
      text_body: OperatelyEmail.Views.ProjectReviewSubmitted.text(assigns)
    )
  end

  def sender(company) do
    {org_name(company), Application.get_env(:operately, :notification_email)}
  end

  def subject(company, short_name, project) do
    "#{org_name(company)}: #{Person.short_name(short_name)} submitted a review for #{project.name}"
  end

  def org_name(company) do
    "Operately (#{company.name})"
  end

  def cta_url(project, review) do
    OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/reviews/#{review.id}"
  end
end
