defmodule OperatelyEmail.GoalArchivedEmail do
  @view OperatelyEmail.Views.GoalArchived

  alias Operately.People.Person

  def send(person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    goal = Operately.Goals.get_goal!(activity.content["goal_id"])
    email = compose(author, goal, person)

    OperatelyEmail.Mailer.deliver_now(email)
  end

  def compose(author, goal, recipient) do
    import Bamboo.Email

    company = Operately.Repo.preload(author, :company).company

    assigns = %{
      title: subject(company, author, goal),
      author: author,
      goal: goal,
      cta_url: OperatelyEmail.goal_url(goal.id),
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, goal),
      html_body: @view.html(assigns),
      text_body: @view.text(assigns)
    )
  end

  def subject(company, author, goal) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(author)} archived the #{goal.name} goal in Operately"
  end
end
