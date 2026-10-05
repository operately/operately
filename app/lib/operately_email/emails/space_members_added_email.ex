defmodule OperatelyEmail.Emails.SpaceMembersAddedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Groups}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    space = Groups.get_group!(activity.content["space_id"])
    company = Repo.preload(space, :company).company
    link = OperatelyWeb.Paths.space_path(company, space) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} added you to the %{space_name} space", location: space.name, author: Operately.People.Person.short_name(author), space_name: space.name))
    |> assign(:author, author)
    |> assign(:space, space)
    |> assign(:link, link)
    |> render("space_members_added")
  end
end
