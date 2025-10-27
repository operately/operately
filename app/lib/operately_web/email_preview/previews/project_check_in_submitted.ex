defmodule OperatelyWeb.EmailPreview.Previews.ProjectCheckInSubmitted do
  @moduledoc "Mock data for the project check-in submitted email preview."

  alias OperatelyEmail.Mailers.ActivityMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview
  alias Operately.RichContent.Builder, as: RC

  @base_cta_url "https://app.operately.dev/projects/launch-website/check-ins/weekly-update"

  def reviewer_acknowledge do
    context = base_context()
    reviewer = context.reviewer

    check_in =
      context.check_in
      |> Map.merge(%{
        status: :caution,
        description: check_in_description(:caution)
      })

    overview = overview_doc(:caution, reviewer)

    build_preview(%{
      company: context.company,
      author: context.author,
      project: context.project,
      person: reviewer,
      check_in: check_in,
      overview: overview,
      cta_text: "Acknowledge",
      cta_url: "#{@base_cta_url}?acknowledge=true"
    })
  end

  def teammate_view do
    context = base_context()
    teammate = context.teammate

    check_in =
      context.check_in
      |> Map.merge(%{
        status: :on_track,
        description: check_in_description(:on_track)
      })

    overview = overview_doc(:on_track, context.reviewer)

    build_preview(%{
      company: context.company,
      author: context.author,
      project: context.project,
      person: teammate,
      check_in: check_in,
      overview: overview,
      cta_text: "View Check-In",
      cta_url: @base_cta_url
    })
  end

  def no_reviewer do
    context = base_context()
    teammate = context.teammate
    project = Map.put(context.project, :reviewer, nil)

    check_in =
      context.check_in
      |> Map.merge(%{
        status: :off_track,
        description: check_in_description(:off_track)
      })

    overview = overview_doc(:off_track, nil)

    build_preview(%{
      company: context.company,
      author: context.author,
      project: project,
      person: teammate,
      check_in: check_in,
      overview: overview,
      cta_text: "View Check-In",
      cta_url: @base_cta_url
    })
  end

  defp build_preview(%{
         company: company,
         author: author,
         project: project,
         person: person,
         check_in: check_in,
         overview: overview,
         cta_text: cta_text,
         cta_url: cta_url
       }) do
    email =
      company
      |> Mailer.new()
      |> Mailer.from(author)
      |> Mailer.to(person)
      |> Mailer.subject(where: project.name, who: author, action: "submitted a check-in")
      |> Mailer.assign(:author, author)
      |> Mailer.assign(:project, project)
      |> Mailer.assign(:check_in, check_in)
      |> Mailer.assign(:overview, overview)
      |> Mailer.assign(:cta_url, cta_url)
      |> Mailer.assign(:cta_text, cta_text)

    Preview.build(email, "project_check_in_submitted")
  end

  defp base_context do
    company = %{name: "Acme Corporation"}
    author = person(%{id: "person-001", full_name: "Alex Murphy", email: "alex@localhost.com"})
    reviewer = person(%{id: "person-002", full_name: "Jordan Smith", email: "jordan@localhost.com"})
    teammate = person(%{id: "person-003", full_name: "Morgan Lee", email: "morgan@localhost.com"})

    project = %{
      id: "proj-001",
      name: "Launch Website Project",
      reviewer: reviewer,
      company: company,
      timeframe: %{end_date: Date.add(Date.utc_today(), 14)}
    }

    check_in = %{
      id: "check-in-001",
      title: "Weekly Health Check",
      description: check_in_description(:on_track),
      status: :on_track
    }

    %{
      company: company,
      author: author,
      reviewer: reviewer,
      teammate: teammate,
      project: project,
      check_in: check_in
    }
  end

  defp person(%{id: id, full_name: full_name, email: email}) do
    %{id: id, full_name: full_name, email: email}
  end

  defp overview_doc(:on_track, _reviewer) do
    RC.doc([
      RC.paragraph([
        RC.text("The project is "),
        RC.bg_green("on track"),
        RC.text(" and the launch tasks are moving forward as planned.")
      ])
    ])
  end

  defp overview_doc(:caution, reviewer) do
    reviewer_note =
      case reviewer do
        nil -> []
        person -> [RC.text(" "), RC.text(first_name(person)), RC.text(" should keep an eye on the blockers.")]
      end

    RC.doc([
      RC.paragraph(
        [
          RC.text("The project "),
          RC.bg_yellow("needs attention"),
          RC.text(" because review feedback is still outstanding.")
        ] ++ reviewer_note
      )
    ])
  end

  defp overview_doc(:off_track, reviewer) do
    reviewer_note =
      case reviewer do
        nil -> []
        person -> [RC.text(" "), RC.text(first_name(person)), RC.text(" support is urgently needed.")]
      end

    RC.doc([
      RC.paragraph(
        [
          RC.text("The project is "),
          RC.bg_red("off track"),
          RC.text(" due to a critical production issue that blocked deployment."),
          RC.text(" "),
          RC.text("Launch is now at risk.")
        ] ++ reviewer_note
      )
    ])
  end

  defp check_in_description(:on_track) do
    RC.doc([
      RC.paragraph([
        RC.text("Completed the marketing site hero design and published the launch checklist.")
      ]),
      RC.paragraph([
        RC.text("Up next: finalize stakeholder sign-offs and prepare the QA review.")
      ])
    ])
  end

  defp check_in_description(:caution) do
    RC.doc([
      RC.paragraph([
        RC.text("Content migration is still in progress and is trending a day behind schedule.")
      ]),
      RC.paragraph([
        RC.text("Waiting on final copy updates from the product team before we can wrap up.")
      ])
    ])
  end

  defp check_in_description(:off_track) do
    RC.doc([
      RC.paragraph([
        RC.text("Deployment rollback consumed most of the sprint and we are reassessing the launch timeline.")
      ]),
      RC.paragraph([
        RC.text("Critical tasks are paused while we investigate the production issue with engineering.")
      ])
    ])
  end

  defp first_name(person) do
    person.full_name
    |> String.split(" ")
    |> List.first()
  end
end
