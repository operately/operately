defmodule Operately.Features.TenetsTest do
  use Operately.FeatureCase

#   setup session do
#     session = session |> UI.login() |> visit_page()

#     {:ok, %{session: session}}
#   end

#   feature "creating a new tenet", state do
#     tenet = "Customer Obsession"

#     state
#     |> click_new_tenet()
#     |> set_name(tenet)
#     |> save()
#     |> assert_tenet_is_in_the_list(tenet)
#   end

#   # ===========================================================================

#   defp visit_page(state), do: UI.visit(state, "/tenets")
#   def click_new_tenet(state), do: UI.click_link(state, "New Tenet")

#   def save(state) do
#     state
#     |> UI.click_button("Save")
#     |> UI.wait_for_page_to_load("/tenets")
#   end

#   def set_name(state, name) do
#     UI.fill(state, "Name", with: name)
#   end

#   def assert_tenet_is_in_the_list(state, project) do
#     UI.assert_text(state, project)
#   end
end
