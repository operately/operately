defmodule OperatelyWeb.ObjectiveTree do
  use Phoenix.Component
  use OperatelyWeb, :html

  attr :objective, :list
  attr :alignments, :list

  def objective_tree(assigns) do
    alias OperatelyWeb.ObjectiveTree.Tree

    tree = Tree.build_tree(assigns.objective, assigns.alignments)

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
        <div class="absolute -mt-4 border-l border-gray-200 top-0 bottom-8"></div>

        <%= for node <- @nodes do %>
          <%= objective_tree_node(%{node: node}) %>
        <% end %>
      </div>
    """
  end

  defp objective_tree_node(%{node: node} = assigns) do
    ~H"""
    <div>
      <%= objective_tree_objective(%{objective: @node.objective}) %>
      <%= objective_children(%{nodes: @node.children, indent: "ml-10"}) %>
    </div>
    """
  end

  defp objective_tree_objective(%{objective: objective} = assigns) do
    ~H"""
      <div class="flex items-center relative z-10">
        <div class="w-4">
          <div class="flex items-center" style="margin-left: -1px">
            <div class="w-1 h-1 bg-gray-200 rounded-full"></div>
            <div class="w-4 border-t border-gray-200"></div>
          </div>
        </div>

        <a href={~p"/objectives/#{@objective}"} class="block flex-1 my-1 shadow-md rounded-lg bg-white hover:border-r hover:border-r-8">
          <div class="px-2 py-1">
            <div class="flex items-center">
              <div class="w-10 mr-2">
                <div class="flex items-center">
                  <div>
                    <img
                      alt="Man"
                      src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
                      class="h-10 w-10 rounded object-cover"
                    />
                  </div>

                </div>
              </div>

              <div class="flex-1">
                <span><%= @objective.name %></span>

                <div>
                  <p class="text-sm"><span class="text-sky-500">John Doe</span> &middot; <span class="text-sky-500">Head of Customer Success</span></p>
                </div>
              </div>

              <div class="text-right inline-flex gap-2">
                <span class="inline-flex items-center justify-center rounded-full bg-sky-100 px-2.5 py-0.5 text-sky-500">
                  <p class="whitespace-nowrap text-sm">Q1 2023</p>
                </span>

                <span class="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                  <p class="whitespace-nowrap text-sm">On Track</p>
                </span>
              </div>
            </div>
          </div>
        </a>
      </div>
    """
  end

  defmodule Tree do
    def build_tree(objectives, alignments) do
      root_objectives = find_root_objectives(objectives, alignments)

      root_objectives
      |> Enum.map(fn root_objective ->
        build_tree_for_objective(root_objective, objectives, alignments)
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

    def build_tree_for_objective(objective, objectives, alignments) do
      children = Enum.filter(objectives, fn possible_child ->
        Enum.any?(alignments, fn alignment ->
          alignment.parent == objective.id && alignment.child == possible_child.id
        end)
      end)

      children = children
                 |> Enum.map(fn child ->
                   build_tree_for_objective(child, objectives, alignments)
                 end)

      %{objective: objective, children: children}
    end

    def to_list_preorder(tree, level \\ 0) do
      tree
      |> Enum.flat_map(fn node ->
        [{node.objective, level}] ++ to_list_preorder(node.children, level + 1)
      end)
    end
  end
end
