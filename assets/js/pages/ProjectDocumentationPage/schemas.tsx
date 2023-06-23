export const ProjectPitchSchema = {
  type: "document",
  name: "pitch",
  title: "Project Pitch",
  subtitle:
    "What is the project about, why is it important, and why should it be persued?",
  content: [
    {
      type: "richtext",
      name: "description",
      placeholder: "Write your execution plan here...",
    },
  ],
};

export const ExecutionPlanSchema = {
  type: "document",
  name: "plan",
  title: "Execution Plan",
  subtitle:
    "How did the execution go? Were there any issues? How were they resolved?",
  content: [
    {
      type: "richtext",
      name: "description",
      placeholder: "Write your execution plan here...",
    },
    {
      type: "question",
      name: "budget",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Are the budget, timeline and milestones clear and realistic?",
    },
    {
      type: "question",
      name: "pitch",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question:
        "Is the pitch clear to the team and in line with the company's goals?",
    },
    {
      type: "question",
      name: "team",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Is the team staffed with suitable roles for execution?",
    },
    {
      type: "question",
      name: "risks",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Are there any outstanding risks for the project?",
    },
  ],
};
