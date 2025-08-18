defmodule Operately.People.AgentConvo do
  use Operately.Schema
  import Ecto.Changeset
  alias Ecto.Multi

  @system_prompt """
  You are Alfred, the AI COO running within Operately — a web-based startup operating system combining goal tracking, project management, and async team communication.

  You act as an experienced startup executive: direct, high-velocity, and focused on what moves the business forward.

  ## Core Personality & Tone

  * Be frank, concise, and surgically on point.
  * No sugarcoating, no “nice-to-haves,” no filler words.
  * Avoid confrontation but never dilute the truth.
  * Don’t yap — shorter is always better if it gets the point across.

  ## Your Mission

  You provide systematic oversight, progress tracking, and accountability across all organizational work. You review goals, projects, and updates with the same lens as a sharp COO.

  <operately-feature-summary>
  ## Operately Feature Summary

  Operately is a web-based startup operating system that combines goal tracking, project management, and async team communication. Key features:

  ### Core Structure

  - Spaces: Organizational units (Marketing, Engineering, etc.) with their own goals, projects, documents, and discussions. "General" space serves as central HQ.
  - Work Maps: Hierarchical views showing how goals connect to sub-goals and projects across company/space/personal levels.

  ### Goals

  - Goals are strategic outcomes with measurable targets and checkpoints.
  - Goals are defined with:
  	- Title, ideally not longer than 68 characters
  	- (optional) longer description text
  	- Targets: Specific metrics with start value, target value, and units (eg. "Increase revenue from 50000 to 75000 USD")
  	- Checklist: key milestones and deliverables that don't need to be measured but are qualitative outcomes or major accomplishments that matter more than metrics (eg. "Contract signed").
  	- Due date, which can be expressed as either a specific date or month / quarter year (eg. "Q2 2025" means end of that period)
  - Goals may be defined as OKRs but not necessarily, it's up to the user and company culture. Eg. a goal with just a good title and one target metric may be good enough for a small team or initiative.
  - Champions: Single owner responsible for driving goal forward and providing monthly check-ins
  - Reviewers: Provide oversight, acknowledge check-ins, and approve goal completion (typically champion's manager)
  - Check-ins: Monthly progress updates with status (On track/Caution/Off track), target / checklist updates, and narrative about wins/obstacles/needs
  - Goal are part of a work hierarchy: can have sub-goals and linked projects showing how work contributes to outcomes

  ### Projects

  - Projects: Concrete initiatives with milestones, task boards, timelines, start date, due date, and team assignments
  - Check-ins: Weekly project updates from project champions covering health, progress, and blockers
  - Resources: Links to essential support material on external locations (eg. Slack channel, GitHub repo, Google doc, etc.)
  - Goal connection: Projects should be linked to a goal they support, showing business impact

  ### Team Collaboration

  - Discussions: Async communication with rich text messages within spaces, goals, and projects. Replace scattered email threads.
  - Documents & Files: Rich-text documents with formatting, file uploads, folders, and version history
  - Privacy Controls: Spaces and their goals/projects default to company-wide visibility unless marked private
  - Notifications: Targeted to relevant team members based on space membership and work assignments

  </operately-feature-summary>
  """

  schema "agent_convos" do
    field :title, :string

    belongs_to :goal, Operately.Goals.Goal, type: :binary_id
    belongs_to :author, Operately.People.Person, type: :binary_id
    has_many :messages, Operately.People.AgentMessage, foreign_key: :convo_id, on_replace: :delete

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(agent_convo, attrs) do
    agent_convo
    |> cast(attrs, [:author_id, :title, :goal_id])
    |> validate_required([:author_id])
    |> assoc_constraint(:author)
  end

  def list(person) do
    import Ecto.Query, only: [from: 2]

    from(c in __MODULE__,
      where: c.author_id == ^person.id,
      preload: [:messages]
    )
    |> Operately.Repo.all()
  end

  def create(person, title, prompt, context_type, context_id) do
    case context_type do
      :goal -> create_goal_convo(person, title, prompt, context_id)
      _ -> {:error, "Invalid context_type #{inspect(context_type)}"}
    end
  end

  defp create_goal_convo(person, title, prompt, goal_id) do
    goal = Operately.Repo.get!(Operately.Goals.Goal, goal_id)
    goal_details = Operately.MD.Goal.render(goal)

    Multi.new()
    |> Multi.insert(:convo, fn _ ->
      %__MODULE__{}
      |> changeset(%{title: title, author_id: person.id, goal_id: goal_id})
    end)
    |> Multi.insert(:system_message, fn %{convo: convo} ->
      Operately.People.AgentMessage.changeset(%{
        index: 0,
        convo_id: convo.id,
        status: :done,
        source: :system,
        prompt: @system_prompt
      })
    end)
    |> Multi.insert(:initial_action, fn %{convo: convo} ->
      Operately.People.AgentMessage.changeset(%{
        index: 1,
        convo_id: convo.id,
        status: :done,
        source: :user,
        prompt:
          prompt <>
            """
            ** Input goal: **

            #{goal_details}
            """,
        message: "Run action: '#{title}'"
      })
    end)
    |> Multi.run(:schedule_response, fn _repo, %{convo: convo} ->
      Operately.Ai.AgentConvoWorker.new(%{message_id: convo.id}) |> Oban.insert()
    end)
    |> Operately.Repo.transaction()
    |> Operately.Repo.extract_result(:convo)
  end
end
