# Seeding data for development

defmodule Operately.Seeds do
  def seed do
    people = seed_people()
    objectives = seed_objectives(people)

    IO.inspect("Inserted #{Enum.count(people)} people")
    IO.inspect("Inserted #{Enum.count(objectives)} objectives")
  end

  def seed_people do
    people = [
      %{full_name: "John Smith", title: "Chief Executive Officer", handle: "@john"},
      %{full_name: "Samantha Lee", title: "Chief Marketing Officer", handle: "@samantha"},
      %{full_name: "David Chen", title: "Chief Financial Officer", handle: "@david"},
      %{full_name: "Michelle Rodriguez", title: "Chief Operating Officer", handle: "@michelle"},
      %{full_name: "Emily Kim", title: "Marketing Manager", handle: "@kim"},
      %{full_name: "Brian Johnson", title: "Sales Director", handle: "@brianJohnson"},
      %{full_name: "Magdalena Novakova", title: "HR Manager", handle: "@magdalena"},
      %{full_name: "Jason Wu", title: "Chief Technology Officer", handle: "@jasonWu"},
      %{full_name: "Karen Tan", title: "Customer Support Manager", handle: "@tan"},
      %{full_name: "Anastasia Horvat", title: "Customer Support Representative", handle: "@ana"},
      %{full_name: "Mariusz Wojciechowski", title: "IT Director", handle: "@mariusz"},
      %{full_name: "Daniel Nguyen", title: "Product Manager", handle: "@danielNguyen"},
    ]

    Enum.map(people, fn p ->
      {:ok, person} = Operately.People.create_person(p)
      person
    end)
  end

  def seed_objectives(people) do
    objectives = [
      %{
        objective: %{name: "Increase company revenue by 5% in Q1 2023", description: "-", owner: "John Smith"},
        children: [
          %{
            objective: %{name: "Improve brand awareness and reach", description: "-", owner: "Samantha Lee"},
            children: [
              %{objective: %{name: "Increase social media followers by 10%", description: "-", owner: "Emily Kim"}},
              %{objective: %{name: "Increase website traffic by 10%", description: "-", owner: "Emily Kim"}},
              %{objective: %{name: "Increase newsletter subscribers by 10%", description: "-", owner: "Emily Kim"}},
            ]
          },
          %{
            objective: %{name: "Launch a new product that focuses on Enterprise customers", description: "-", owner: "Daniel Nguyen"},
            children: []
          }
        ]
      },
      %{
        objective: %{name: "Improve company operational efficiency", description: "-", owner: "Michelle Rodriguez"},
        children: [
          %{
            objective: %{name: "Reduce customer support response times by 50%", description: "-", owner: "Karen Tan"},
            children: [
              %{objective: %{name: "Improve customer support ticketing system", description: "-", owner: "Mariusz Wojciechowski"}},
              %{objective: %{name: "Improve customer support knowledge base", description: "-", owner: "Anastasia Horvat"}}
            ]
          }
        ]
      }
    ]

    create_objectives(objectives, people, parent: nil)
  end

  def create_objectives(nodes, people, parent: parent) do
    Enum.map(nodes, fn node ->
      objective_data = node.objective
      children = node[:children] || []

      {:ok, objective} = Operately.Okrs.create_objective(objective_data)

      person = Operately.People.get_person_by_name!(objective_data.owner)

      {:ok, _ownership} = Operately.Ownerships.create_ownership(%{
        person_id: person.id,
        target: objective.id,
        target_type: :objective
      })

      if parent do
        Operately.Alignments.create_alignment(%{
          parent: parent.id,
          parent_type: :objective,
          child: objective.id,
          child_type: :objective
        })
      end

      if length(children) > 0 do
        create_objectives(children, people, parent: objective)
      end
    end)
  end
end

if Mix.env() == :dev do
  Operately.Seeds.seed()
end
