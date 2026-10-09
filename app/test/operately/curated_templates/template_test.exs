defmodule Operately.CuratedTemplates.TemplateTest do
  use Operately.DataCase, async: true
  alias Operately.CuratedTemplates.Template

  defp changeset(type, definition, state \\ :draft) do
    Template.changeset(%Template{state: state}, %{title: "Example", type: type, definition: definition})
  end

  test "drafts can omit content, but published templates require it" do
    assert changeset(:kpi, %{}).valid?
    refute changeset(:kpi, %{}, :published).valid?
    assert changeset(:kpi, %{"name" => "Revenue", "unit" => "USD", "cadence" => "monthly"}, :published).valid?
  end

  test "rejects unsupported fields and invalid types even in drafts" do
    refute changeset(:kpi, %{"entries" => []}).valid?
    refute changeset(:kpi, %{"cadence" => "daily"}).valid?
    refute changeset(:goal, %{"duration_days" => -1}).valid?
    refute changeset(:project, %{"tasks" => "invalid"}).valid?
    refute changeset(:project, %{"milestones" => [%{"title" => "No key"}]}).valid?
  end

  test "validates nested content and preserves ordering" do
    definition = %{
      "name" => "Launch",
      "milestones" => [%{"key" => "m", "title" => "Ship"}],
      "tasks" => [
        %{"key" => "b", "name" => "Second", "milestone_key" => "m"},
        %{"key" => "a", "name" => "First"}
      ]
    }

    cs = changeset(:project, definition, :published)
    assert cs.valid?
    assert Enum.map(Ecto.Changeset.get_field(cs, :definition)["tasks"], & &1["key"]) == ["b", "a"]
    refute changeset(:project, put_in(definition, ["tasks", Access.at(0), "milestone_key"], "missing")).valid?
    refute changeset(:project, put_in(definition, ["tasks", Access.at(1), "key"], "b")).valid?
  end

  test "goal targets require complete values on publication and allow decreasing targets" do
    assert changeset(:goal, %{"targets" => [%{"name" => "Churn"}]}).valid?
    refute changeset(:goal, %{"name" => "Retention", "targets" => [%{"name" => "Churn"}]}, :published).valid?
    assert changeset(:goal, %{"name" => "Retention", "targets" => [%{"name" => "Churn", "unit" => "%", "from" => 10, "to" => 5}]}, :published).valid?
  end

  test "rejects people, uploads, and unsafe rich text" do
    for node <- [
          %{"type" => "mention", "attrs" => %{"id" => Ecto.UUID.generate()}},
          %{"type" => "image", "attrs" => %{"src" => "https://example.com/a.png"}},
          %{"type" => "text", "text" => "click", "marks" => [%{"type" => "link", "attrs" => %{"href" => "javascript:alert(1)"}}]}
        ] do
      refute changeset(:kpi, %{"description" => %{"type" => "doc", "content" => [node]}}).valid?
    end

    assert changeset(:goal, %{"description" => Operately.Support.RichText.rich_text("Hello")}).valid?
  end

  test "published template type cannot change" do
    cs = Template.changeset(%Template{type: :kpi, state: :published}, %{title: "Other", type: :goal, definition: %{"name" => "Other"}})
    refute cs.valid?
  end
end
