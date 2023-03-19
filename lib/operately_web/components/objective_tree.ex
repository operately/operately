defmodule OperatelyWeb.ObjectiveTree do
  @moduledoc """
  Provides core UI components.

  The components in this module use Tailwind CSS, a utility-first CSS framework.
  See the [Tailwind CSS documentation](https://tailwindcss.com) to learn how to
  customize the generated components in this module.

  Icons are provided by [heroicons](https://heroicons.com), using the
  [heroicons_elixir](https://github.com/mveytsman/heroicons_elixir) project.
  """
  use Phoenix.Component

  attr :objective, :list
  attr :alignments, :list

  def objective_tree(assigns) do
    alias OperatelyWeb.ObjectiveTree.Tree

    tree = Tree.build_tree(assigns.objective, assigns.alignments)

    objective_children(%{nodes: tree, indent: "ml0"})
  end

  defp objective_children(%{nodes: [], indent: indent} = assigns) do
    ""
  end

  defp objective_children(%{nodes: nodes, indent: indent} = assigns) do
    ~H"""
      <div class={"relative " <> @indent}>
        <div class="absolute -mt-4 border-l border-gray-200 top-0 bottom-8"></div>
        <div class="absolute w-2 h-2 rounded-full bg-gray-200 top-0" style="margin-top: -7px; margin-left: -3px"></div>

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

        <div class="flex-1 my-1 shadow-md rounded-lg shadow bg-white">
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

              <div class="w-32 text-right">
                <span class="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                  <p class="whitespace-nowrap text-sm">On Track</p>
                </span>
              </div>
            </div>
          </div>
        </div>
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
