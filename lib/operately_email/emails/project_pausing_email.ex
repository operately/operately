defmodule OperatelyEmail.Emails.ProjectPausingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    raise "Email for ProjectPausing not implemented"

    # author = Repo.preload(activity, :author).author

    # company
    # |> new()
    # |> to(person)
    # |> subject(who: author, action: "did something")
    # |> assign(:author, author)
    # |> render("project_pausing")
  end
end
