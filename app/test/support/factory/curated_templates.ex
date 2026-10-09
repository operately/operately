defmodule Operately.Support.Factory.CuratedTemplates do
  alias Operately.CuratedTemplates
  alias Operately.Operations.CuratedTemplateUpdating

  def add_curated_template(ctx, key, opts \\ []) do
    type = Keyword.get(opts, :type, :kpi)
    attrs = %{title: "Example template", type: type, content_language: "en", definition: definition(type)}
    attrs = Map.merge(attrs, opts |> Keyword.drop([:published, :archived]) |> Map.new())
    {:ok, template} = CuratedTemplates.create(ctx.account, attrs)
    template = if opts[:published], do: publish(template, ctx.account), else: template
    template = if opts[:archived], do: archive(template, ctx.account), else: template
    Map.put(ctx, key, template)
  end

  def definition(:kpi), do: %{"name" => "Revenue", "unit" => "USD", "cadence" => "monthly"}
  def definition(:goal), do: %{"name" => "Retention", "targets" => [%{"name" => "Churn", "unit" => "%", "from" => 10, "to" => 5}]}
  def definition(:project), do: %{"name" => "Launch", "milestones" => [%{"key" => "ship", "title" => "Ship"}], "tasks" => [%{"key" => "build", "name" => "Build", "milestone_key" => "ship"}]}

  defp publish(template, account) do
    {:ok, template} = CuratedTemplateUpdating.run(template, account, template.updated_at, :publish)
    template
  end

  defp archive(template, account) do
    {:ok, template} = CuratedTemplateUpdating.run(template, account, template.updated_at, {:metadata, %{archived: true}})
    template
  end
end
