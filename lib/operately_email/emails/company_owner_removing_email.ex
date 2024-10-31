defmodule OperatelyEmail.Emails.CompanyOwnerRemovingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo

  def send(person, activity) do
    activity = Repo.preload(activity, [:author, :company])

    author = activity.author
    company = author.company

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: "...", who: author, action: "...")
    |> assign(:author, author)
    |> render("company_owner_removing")
  end
end
