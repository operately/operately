defmodule OperatelyEmail.Emails.CompanyMembersPermissionsEditedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.Repo
  alias Operately.Access.Binding
  alias OperatelyWeb.Paths

  def send(person, activity) do
    activity = Repo.preload(activity, [author: :company])
    author = activity.author
    company = author.company
    link = Paths.home_path(company) |> Paths.to_url()

    # Find the member entry for this person in the activity
    member = Enum.find(activity.content["members"] || [], fn m ->
      m["person_id"] == person.id
    end)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: company.name, who: author, action: "updated your access level")
    |> assign(:author, author)
    |> assign(:link, link)
    |> assign(:previous_access_level, access_level_name(member["previous_access_level"]))
    |> assign(:updated_access_level, access_level_name(member["updated_access_level"]))
    |> render("company_members_permissions_edited")
  end

  defp access_level_name(nil), do: "No Access"
  defp access_level_name(level), do: Binding.label(level)
end
