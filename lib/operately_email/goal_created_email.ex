defmodule OperatelyEmail.GoalCreatedEmail do
  @view OperatelyEmail.Views.GoalCreated
  alias Operately.People.Person

  def send(person, activity) do
    if OperatelyEmail.send_email_to_person?(person) do
      author = Operately.Repo.preload(activity, :author).author
      goal = Operately.Goals.get_goal!(activity.content["goal_id"])
      email = compose(author, goal, person)

      OperatelyEmail.Mailer.deliver_now(email)
    end
  end

  def compose(author, goal, recipient) do
    import Bamboo.Email

    company = Operately.Repo.preload(author, :company).company
    role = Operately.Goals.get_role(goal, recipient) |> Atom.to_string()

    assigns = %{
      title: subject(company, author, goal, role),
      author: author,
      role: role,
      goal: goal,
      url: OperatelyEmail.goal_url(goal.id)
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, goal, role),
      html_body: @view.html(assigns),
      text_body: @view.text(assigns)
    )
  end

  def subject(company, author, goal, role) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(author)} added the #{goal.name} goal and assigned you as the #{role}"
  end
end
