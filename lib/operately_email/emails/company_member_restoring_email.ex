defmodule OperatelyEmail.Emails.CompanyMemberRestoringEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  def send(person, activity) do
    author = Repo.preload(activity, :author).author

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: "...", who: author, action: "...")
    |> assign(:author, author)
    |> render("company_member_restoring")
  end
end
