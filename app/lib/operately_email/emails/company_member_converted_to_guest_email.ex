defmodule OperatelyEmail.Emails.CompanyMemberConvertedToGuestEmail do
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
    |> subject(where: company.name, who: author, action: "converted your account to an outside collaborator")
    |> assign(:author, author)
    |> assign(:company, company)
    |> assign(:login_url, login_url)
    |> render("company_member_converted_to_guest")
  end
end
