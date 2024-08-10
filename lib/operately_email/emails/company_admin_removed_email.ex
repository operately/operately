defmodule OperatelyEmail.Emails.CompanyAdminRemovedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    activity = Repo.preload(activity, [author: :company])
    author = activity.author
    company = author.company
    link = Paths.home_path(company) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: company.name, who: author, action: "revoked your admin privileges")
    |> assign(:author, author)
    |> assign(:link, link)
    |> render("company_admin_removed")
  end
end
