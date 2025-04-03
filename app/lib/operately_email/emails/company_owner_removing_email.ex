defmodule OperatelyEmail.Emails.CompanyOwnerRemovingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    person = Repo.preload(person, [:company])
    activity = Repo.preload(activity, [:author])

    author = activity.author
    company = person.company
    link = Paths.home_path(company) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: company.name, who: author, action: "has revoked your account owner status")
    |> assign(:author, author)
    |> assign(:link, link)
    |> render("company_owner_removing")
  end
end
