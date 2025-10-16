defmodule Operately.Data.Change061ConvertRetrospectiveContent do
  alias Operately.Repo
  alias Operately.Projects.Retrospective

  def run do
    retrospectives = Repo.all(Retrospective)

    Enum.each(retrospectives, fn retrospective ->
      if should_convert?(retrospective) do
        convert_and_update(retrospective)
      end
    end)
  end

  defp should_convert?(retrospective) do
    case retrospective.content do
      %{"whatWentWell" => _, "whatDidYouLearn" => _, "whatCouldHaveGoneBetter" => _} -> true
      _ -> false
    end
  end

  defp convert_and_update(retrospective) do
    new_content = update_content(retrospective.content)

    retrospective
    |> Ecto.Changeset.change(%{content: new_content})
    |> Repo.update!()
  end

  defp update_content(content) do
    what_went_well = content["whatWentWell"]
    what_did_learn = content["whatDidYouLearn"]
    what_could_better = content["whatCouldHaveGoneBetter"]

    %{
      "type" => "doc",
      "content" =>
        [
          # What went well section
          %{"type" => "heading", "attrs" => %{"level" => 2}, "content" => [%{"type" => "text", "text" => "What went well?"}]},
          merge_content_or_empty(what_went_well),
          %{"type" => "paragraph", "content" => []},

          # What could have gone better section
          %{"type" => "heading", "attrs" => %{"level" => 2}, "content" => [%{"type" => "text", "text" => "What could have gone better?"}]},
          merge_content_or_empty(what_could_better),
          %{"type" => "paragraph", "content" => []},

          # What did you learn section
          %{"type" => "heading", "attrs" => %{"level" => 2}, "content" => [%{"type" => "text", "text" => "What did you learn?"}]},
          merge_content_or_empty(what_did_learn),
          %{"type" => "paragraph", "content" => []}
        ]
        |> List.flatten()
    }
  end

  # Helper function to handle content that might be missing or in different formats
  defp merge_content_or_empty(section) do
    case section do
      %{"content" => content} when is_list(content) and content != [] -> content
      %{"content" => _} -> [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => ""}]}]
      _ -> [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => ""}]}]
    end
  end
end
