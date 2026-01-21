defmodule OperatelyEmail.Emails.GuestInvitedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.InviteLinks.InviteLink
  alias OperatelyWeb.Paths

  def send(person, activity) do
    activity = Repo.preload(activity, author: :company)
    author = activity.author
    company = author.company
    invite_url = invite_url(activity)
    login_url = invite_url || Paths.to_url(Paths.login_path())

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: company.name, who: author, action: "invited you as a guest")
    |> assign(:author, author)
    |> assign(:company, company)
    |> assign(:login_url, login_url)
    |> render("guest_invited")
  end

  defp invite_url(activity) do
    case activity.content["invite_link_id"] do
      nil ->
        nil

      invite_link_id ->
        invite_link = Repo.get(InviteLink, invite_link_id)

        if invite_link do
          Paths.join_path(invite_link.token) |> Paths.to_url()
        else
          nil
        end
    end
  end
end
