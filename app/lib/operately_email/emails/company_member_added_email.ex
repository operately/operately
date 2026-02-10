defmodule OperatelyEmail.Emails.CompanyMemberAddedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths

  def send(person, activity) do
    activity = Repo.preload(activity, author: :company)
    author = activity.author
    company = author.company
    login_url = Paths.to_url(Paths.login_path())

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: company.name, who: author, action: "added you as a company member")
    |> assign(:author, author)
    |> assign(:company, company)
    |> assign(:person, person)
    |> assign(:login_url, login_url)
    |> render("company_member_added")
  end
end
