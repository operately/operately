defmodule Operately.Operations.ProjectRetrospectiveEditing do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Projects.Retrospective
  alias Operately.Notifications.SubscriptionList

  def run(author, retrospective, new_content) do
    if has_changed?(retrospective.content, new_content) do
      execute(author, retrospective, new_content)
    else
      {:ok, retrospective}
    end
  end

  defp execute(author, retrospective, new_content) do
    Multi.new()
    |> Multi.update(:retrospective, Retrospective.changeset(retrospective, %{
      content: new_content,
    }))
    |> update_subscriptions(new_content)
    |> Activities.insert_sync(author.id, :project_retrospective_edited, fn _ ->
      %{
        company_id: author.company_id,
        space_id: retrospective.project.group_id,
        project_id: retrospective.project_id,
        retrospective_id: retrospective.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:retrospective)
  end

  defp update_subscriptions(multi, new_content) do
    parsed_content = %{
      "content" => [
        new_content["whatWentWell"],
        new_content["whatDidYouLearn"],
        new_content["whatCouldHaveGoneBetter"],
      ]
    }

    multi
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system, parent_id: changes.retrospective.id, opts: [
        preload: :subscriptions
      ])
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(parsed_content)
  end

  #
  # Helpers
  #

  defp has_changed?(content, new_content) do
    content != new_content
  end
end
