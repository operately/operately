defmodule Operately.Support.Factory.Utils do
  @surnames [ 
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor"
  ]

  def testid_to_name(testid) do
    name = Atom.to_string(testid)

    String.capitalize(name) <> " " <> Enum.random(@surnames)
  end
end
