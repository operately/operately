defmodule OperatelyEmail.Emails.TaskAssigneeAssignmentEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    raise "Email for TaskAssigneeAssignment not implemented"

    # author = Repo.preload(activity, :author).author

    # company
    # |> new()
    # |> to(person)
    # |> subject(who: author, action: "did something")
    # |> assign(:author, author)
    # |> render("task_assignee_assignment")
  end
end
