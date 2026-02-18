defmodule OperatelyEmail.Emails.CompanyMemberAddedEmail do
  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.InviteLinks.InviteLink

  def send(person, activity) do
    import OperatelyEmail.Mailers.ActivityMailer

    activity = Repo.preload(activity, author: :company)
    author = activity.author
    company = author.company
    invite_link = get_invite_link(company, person)

    action = get_action(invite_link, company)
    button_text = get_button_text(invite_link, company)
    button_url = get_url(invite_link)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: company.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:company, company)
    |> assign(:person, person)
    |> assign(:action, action)
    |> assign(:button_url, button_url)
    |> assign(:button_text, button_text)
    |> render("company_member_added")
  end

  defp get_invite_link(company, person) do
    import Ecto.Query, only: [from: 2]

    from(link in InviteLink,
      where: link.company_id == ^company.id and link.person_id == ^person.id and link.is_active == true
    )
    |> Repo.one()
  end

  defp get_action(nil, _company), do: "added you as a company member"
  defp get_action(_ = %InviteLink{}, company), do: "invited you to join #{company.name}"

  defp get_button_text(nil, _company), do: "Log in to Operately"
  defp get_button_text(_ = %InviteLink{}, company), do: "Join #{company.name}"

  defp get_url(nil), do: Paths.to_url(Paths.login_path())
  defp get_url(invite_link), do: Paths.to_url(Paths.join_path(invite_link.token))
end
