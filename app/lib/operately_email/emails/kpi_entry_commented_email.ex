defmodule OperatelyEmail.Emails.KpiEntryCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Updates}
  alias Operately.Kpis

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    kpi = Kpis.get_kpi!(activity.content["kpi_id"]) |> Repo.preload(:space)
    comment = Updates.get_comment!(activity.content["comment_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: kpi.space.name, who: author, action: "commented on a KPI update: #{kpi.name}")
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, kpi.name)
    |> assign(:cta_url, Paths.space_kpi_path(company, kpi.space, kpi, comment) |> Paths.to_url())
    |> render("kpi_entry_commented")
  end

  def buffered_item(_person, activity) do
    kpi = Kpis.get_kpi!(activity.content["kpi_id"]) |> Repo.preload(:space)
    comment = Updates.get_comment!(activity.content["comment_id"])
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    parent = OperatelyEmail.DigestParent.for_kpi(kpi)
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(comment.content)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "commented on a KPI update for \"#{kpi.name}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: Paths.space_kpi_path(company, kpi.space, kpi, comment) |> Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
