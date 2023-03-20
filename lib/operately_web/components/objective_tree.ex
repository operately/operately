defmodule OperatelyWeb.ObjectiveTree do
  use Phoenix.Component
  use OperatelyWeb, :html

  def avatar(person, size \\ "w-10 h-10") do
    name_parts = person.full_name |> String.split(" ") |> Enum.map(&String.at(&1, 0))

    first_name = List.first(name_parts)
    last_name = List.last(name_parts)

    first_letter = String.at(first_name, 0)
    last_letter = String.at(last_name, 0)

    initials = String.upcase(first_letter <> last_letter)
    assigns = %{initials: initials}

    colors = ["bg-zinc-100", "bg-rose-50", "bg-emerald-100", "bg-sky-100", "bg-gray-100"]
    color_index = initials |> String.to_charlist() |> Enum.sum() |> rem(Enum.count(colors))
    color = Enum.at(colors, color_index)

    ~H"""
    <div class={color <> " " <> size <> " rounded-lg flex items-center justify-center"}>
      <span class="font-bold text-lg"><%= @initials %></span>
    </div>
    """
  end

  attr :objectives, :list
  attr :group_by, :string

  def objective_list(assigns) do
    grouped_objectives =
      assigns.objectives
      |> Enum.group_by(fn o -> o.owner.id end)
      |> Enum.sort_by(fn {_, objectives} -> -length(objectives) end)

    ~H"""
    <div class="flex flex-col gap-4">
      <%= for {owner_id, objectives} <- grouped_objectives do %>
        <div>
          <div class="flex flex-row items-center gap-2 z-10 relative">
            <div class="rounded-lg border border-zinc-200">
              <div class="flex items-center">
                <div>
                  <%= avatar(Enum.at(objectives, 0).owner, "w-10 h-10") %>
                </div>
              </div>
            </div>

            <div class="text-left gap-2">
              <div class="text font-bold"><%= Enum.at(objectives, 0).owner.full_name %></div>
              <div class="text text-gray-500 text-xs"><%= Enum.at(objectives, 0).owner.title %></div>
            </div>
          </div>

          <div class="ml-6 mt-2 relative">
            <div class="absolute -mt-4 border-l border-gray-300 top-0 bottom-8"></div>
            <%= for objective <- objectives do %>
              <%= objective_tree_objective(%{objective: objective, show_owner: false}) %>
            <% end %>
          </div>
        </div>
      <% end %>
    </div>
    """
  end

  attr :objective, :list
  attr :alignments, :list
  attr :max_depth, :integer

  def objective_tree(assigns) do
    alias OperatelyWeb.ObjectiveTree.Tree

    tree = Tree.build_tree(assigns.objective, assigns.alignments, assigns.max_depth)

    ~H"""
      <div class="relative z-20 mb-4 flex">
        <div class="px-2 py-1 bg-white shadow rounded-lg flex gap-2 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <path fill-rule="evenodd" d="M1 2.75A.75.75 0 011.75 2h10.5a.75.75 0 010 1.5H12v13.75a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5H2v-13h-.25A.75.75 0 011 2.75zM4 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM4.5 9a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zM8 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM8.5 9a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zM14.25 6a.75.75 0 00-.75.75V17a1 1 0 001 1h3.75a.75.75 0 000-1.5H18v-9h.25a.75.75 0 000-1.5h-4zm.5 3.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z" clip-rule="evenodd" />
          </svg>

          Rendered Text &mdash; <%= length(assigns.objective) %> objectives
        </div>
      </div>

      <%= objective_children(%{nodes: tree, indent: "ml-4"}) %>
    """
  end

  defp objective_children(%{nodes: [], indent: indent} = assigns) do
    ""
  end

  defp objective_children(%{nodes: nodes, indent: indent} = assigns) do
    ~H"""
      <div class={"relative " <> @indent}>
        <div class="absolute -mt-4 border-l border-gray-300 top-0 bottom-8"></div>

        <%= for node <- @nodes do %>
          <%= objective_tree_node(%{node: node}) %>
        <% end %>
      </div>
    """
  end

  defp objective_tree_node(%{node: node} = assigns) do
    ~H"""
    <div>
      <%= objective_tree_objective(%{objective: @node.objective, show_owner: true}) %>
      <%= objective_children(%{nodes: @node.children, indent: "ml-10"}) %>
    </div>
    """
  end

  defp objective_tree_objective(%{objective: objective, show_owner: show_owner} = assigns) do
    ~H"""
      <div class="flex items-center relative z-10">
        <div class="w-4">
          <div class="flex items-center" style="margin-left: -1px">
            <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div class="w-4 border-t border-gray-300"></div>
          </div>
        </div>

        <a href={~p"/objectives/#{@objective}"} class="block flex-1 my-1 shadow rounded-lg bg-white hover:border-r hover:border-r-8">
          <div class="px-2 py-1">
            <div class="flex items-center">
              <div class="flex-1">
                <span class="font-bold"><%= @objective.name %></span>

                <div class="text-gray-500 text-sm flex items-center gap-2">
                  <span class="inline-flex items-center justify-center text-xs bg-emerald-100 text-emerald-800 px-1">On Track</span>

                  <span class="inline-flex items-center justify-center">
                    <div class="scale-75">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                        <path d="M5.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V12zM6 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H6zM7.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75V12zM8 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H8zM9.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V10zM10 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H10zM9.25 14a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H10a.75.75 0 01-.75-.75V14zM12 9.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V10a.75.75 0 00-.75-.75H12zM11.25 12a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H12a.75.75 0 01-.75-.75V12zM12 13.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75H12zM13.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75H14a.75.75 0 01-.75-.75V10zM14 11.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75V12a.75.75 0 00-.75-.75H14z" />
                        <path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd" />
                      </svg>
                    </div>

                    <p class="whitespace-nowrap text-xs">Q1 2023</p>
                  </span>
                </div>
              </div>

              <%= if @show_owner do %>
                <div class="text-right gap-2">
                  <div class="text-sm"><%= @objective.owner.full_name %></div>
                  <div class="text-xs text-gray-500"><%= @objective.owner.title %></div>
                </div>

                <div class="w-10 ml-2">
                  <div class="flex items-center">
                    <div>
                      <span><%= avatar(@objective.owner) %></span>
                    </div>
                  </div>
                </div>
              <% end %>
            </div>
          </div>
        </a>
      </div>
    """
  end

  defmodule Tree do
    def build_tree(objectives, alignments, max_depth) do
      root_objectives = find_root_objectives(objectives, alignments)

      root_objectives
      |> Enum.map(fn root_objective ->
        build_tree_for_objective(root_objective, objectives, alignments, 0, max_depth)
      end)
    end

    def find_root_objectives(objectives, alignments) do
      objectives
      |> Enum.filter(fn objective ->
        Enum.empty?(Enum.filter(alignments, fn alignment ->
          alignment.child == objective.id
        end))
      end)
    end

    def build_tree_for_objective(objective, objectives, alignments, depth, max_depth) do
      if depth >= max_depth - 1 do
        %{objective: objective, children: []}
      else
        children = Enum.filter(objectives, fn possible_child ->
          Enum.any?(alignments, fn alignment ->
            alignment.parent == objective.id && alignment.child == possible_child.id
          end)
        end)

        children = children
                   |> Enum.map(fn child ->
                     build_tree_for_objective(child, objectives, alignments, depth+1, max_depth)
                   end)

        %{objective: objective, children: children}
      end
    end

    def to_list_preorder(tree, level \\ 0) do
      tree
      |> Enum.flat_map(fn node ->
        [{node.objective, level}] ++ to_list_preorder(node.children, level + 1)
      end)
    end
  end
end
