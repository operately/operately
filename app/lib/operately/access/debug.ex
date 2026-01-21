defmodule Operately.Access.Debug do
  def show_bindings(resource) do
    context = Operately.Repo.preload(resource, [:access_context]).access_context
    bindings = Operately.Repo.preload(context, [:bindings]).bindings

    IO.puts("")
    IO.puts("Bindings for #{inspect(resource.__struct__)} id=#{resource.id}:")

    bindings
    |> Enum.map(fn binding -> show_binding(binding) end)
  end

  defp show_binding(binding) do
    group = Operately.Repo.preload(binding, [:group]).group
    show_group(binding, group)
  end

  defp show_group(binding, %Operately.Access.Group{company_id: company_id}) when company_id != nil do
    company = Operately.Companies.get_company!(company_id)
    IO.puts("- #{show_level(binding)} - #{company.name} (#{company.id})")
  end

  defp show_group(binding, %Operately.Access.Group{group_id: space_id}) when space_id != nil do
    space = Operately.Groups.get_group!(space_id)
    IO.puts("- #{show_level(binding)} - #{space.name} (#{space.id})")
  end

  defp show_group(binding, %Operately.Access.Group{person_id: person_id}) when person_id != nil do
    person = Operately.People.get_person!(person_id)
    IO.puts("- #{show_level(binding)} - #{person.full_name} (#{person.email}) #{show_tag(binding)}")
  end

  defp show_level(binding) do
    case binding.access_level do
      10 -> "view    "
      40 -> "comment "
      55 -> "contrib "
      70 -> "edit    "
      100 -> "full    "
      other -> "unknown #{other}"
    end
  end

  defp show_tag(binding) do
    case binding.tag do
      nil -> ""
      tag -> "tag=#{tag}"
    end
  end
end
