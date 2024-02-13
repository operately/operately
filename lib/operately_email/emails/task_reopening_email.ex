defmodule OperatelyEmail.Emails.TaskReopeningEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    raise "Email for TaskReopening not implemented"

    # author = Repo.preload(activity, :author).author

    # company
    # |> new()
    # |> to(person)
    # |> subject(who: author, action: "did something")
    # |> assign(:author, author)
    # |> render("task_reopening")
  end
end
